import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { getFunctions, httpsCallable } from "firebase/functions";
import Constants from "expo-constants";
import { ref, onValue, set } from "firebase/database";
import { faidaDb } from "../firebase/firebase";
import { useNavigation } from "@react-navigation/native";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;

/* ---------------- DISTANCE HELPER ---------------- */
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const TripScreen = ({ route }) => {
  const { driver, destination, rideData } = route.params;

  const navigation = useNavigation();
  const functions = getFunctions();
  const completeTrip = httpsCallable(functions, "completeTrip");
  const mapRef = useRef(null);

  const tripStartTimeRef = useRef(Date.now());
  const previousPointRef = useRef(null);
  const arrivalCountRef = useRef(0);

  const [driverLocation, setDriverLocation] = useState(null);
  const [distanceLeft, setDistanceLeft] = useState(null);
  const [eta, setEta] = useState(null);
  const [tripEnded, setTripEnded] = useState(false);

  const [actualDistanceKm, setActualDistanceKm] = useState(0);

  const vehicleImage =
    rideData.type === "Roka"
      ? require("../assets/weari/roka_satelite.png")
      : rideData.type === "Wea"
      ? require("../assets/weari/wea_satelite.png")
      : rideData.type === "Mchoro"
      ? require("../assets/weari/mchoro_satelite.png")
      : require("../assets/weari/wea_satelite.png");

  /* ---------------- LIVE DRIVER LOCATION ---------------- */
  useEffect(() => {
    const locationRef = ref(
      faidaDb,
      `KandoFaida/mobility_partners/${driver.mp_id}/location`
    );

    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const loc = snapshot.val();
      if (!loc?.lat || !loc?.lng) return;

      // ignore bad GPS
      if (loc?.accuracy && loc.accuracy > 30) return;

      const newPoint = {
        latitude: loc.lat,
        longitude: loc.lng,
      };

      /* ---------------- DISTANCE TRAVELLED ---------------- */
      if (previousPointRef.current) {
        const segment = getDistanceMeters(
          previousPointRef.current.latitude,
          previousPointRef.current.longitude,
          newPoint.latitude,
          newPoint.longitude
        );

        if (segment < 100) {
          setActualDistanceKm((old) => old + segment / 1000);
        }
      }

      previousPointRef.current = newPoint;

      /* ---------------- GPS SMOOTHING ---------------- */
      setDriverLocation((prev) => {
        if (!prev) return newPoint;

        return {
          latitude: prev.latitude * 0.7 + newPoint.latitude * 0.3,
          longitude: prev.longitude * 0.7 + newPoint.longitude * 0.3,
        };
      });
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- AUTO FIT MAP ---------------- */
  useEffect(() => {
    if (!driverLocation || !destination) return;

    mapRef.current?.fitToCoordinates([driverLocation, destination], {
      edgePadding: {
        top: 100,
        right: 50,
        bottom: 200,
        left: 50,
      },
      animated: true,
    });
  }, [driverLocation, destination]);

  const finishTrip = async () => {
  if (tripEnded) return;

  setTripEnded(true);

  const actualMinutes =
    (Date.now() - tripStartTimeRef.current) / 60000;

  try {
    const result = await completeTrip({
      driverId: driver.mp_id,
      rideType: rideData.type,
      actualDistanceKm,
      actualMinutes,
    });

    navigation.replace("Arrived", {
      driver,
      rideData,
      finalFare: result.data.finalFare,
      actualDistanceKm,
      actualMinutes,
    });

  } catch (err) {
    console.log(err);
    setTripEnded(false);
  }
};
  /* ---------------- ARRIVAL DETECTION ---------------- */
  useEffect(() => {
    if (!driverLocation || !destination || tripEnded) return;

    const distance = getDistanceMeters(
      driverLocation.latitude,
      driverLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    if (distance <= 60) {
      arrivalCountRef.current += 1;
    } else {
      arrivalCountRef.current = 0;
    }

    if (arrivalCountRef.current >= 3) {
      finishTrip();
    }
  }, [driverLocation]);

  /* ---------------- LOADING ---------------- */
  if (!driverLocation || !destination) {
    return (
      <View style={styles.center}>
        <Text>Loading trip...</Text>
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={driverLocation}>
          <Image source={vehicleImage} style={styles.markerImage} />
        </Marker>

        <Marker coordinate={destination} pinColor="green" />

        <MapViewDirections
          origin={driverLocation}
          destination={destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={5}
          strokeColor="black"
          onReady={(result) => {
            setDistanceLeft(result.distance);
            setEta(Math.ceil(result.duration));
          }}
        />
      </MapView>

      <View style={styles.card}>
        <Text style={styles.title}>Trip in Progress</Text>

        <Text style={styles.info}>
          Destination: {rideData.destinationName || "Drop-off"}
        </Text>

        <Text style={styles.big}>
          {distanceLeft ? distanceLeft.toFixed(1) : "--"} km remaining
        </Text>

        <Text style={styles.info}>ETA: {eta || "--"} min</Text>

        <Text style={styles.fare}>
          Fare will be calculated at end of trip
        </Text>
      </View>
    </View>
  );
};

export default TripScreen;