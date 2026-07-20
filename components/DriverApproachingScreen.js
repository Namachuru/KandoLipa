import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { ref, onValue, set } from "firebase/database";
import { faidaDb } from "../firebase/firebase";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;

// ✅ distance helper
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

const DriverApproachingScreen = ({ route }) => {
  const { driver, rideData, pickupLocation, destination } = route.params;

  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [driverLocation, setDriverLocation] = useState(null);
  const hasArrivedRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  const vehicleImage =
    rideData.type === "Roka"
      ? require("../assets/weari/roka_satelite.png")
      : rideData.type === "Wea"
      ? require("../assets/weari/wea_satelite.png")
      : rideData.type === "Mchoro"
      ? require("../assets/weari/mchoro_satelite.png")
      : require("../assets/weari/wea_satelite.png");

  const pickupCoords =
    pickupLocation?.latitude && pickupLocation?.longitude
      ? {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        }
      : null;

  // 🔴 LIVE DRIVER LOCATION
  useEffect(() => {
    const locationRef = ref(
      faidaDb,
      `KandoFaida/mobility_partners/${driver.mp_id}/location`
    );

    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const location = snapshot.val();

      if (location?.lat == null || location?.lng == null) return;

      setDriverLocation({
        latitude: location.lat,
        longitude: location.lng,
      });
    });

    return () => unsubscribe();
  }, [driver.mp_id]);

  // 🔥 AUTO FIT MAP
  useEffect(() => {
    if (!driverLocation || !pickupCoords) return;

    mapRef.current?.fitToCoordinates([driverLocation, pickupCoords], {
      edgePadding: {
        top: 120,
        right: 80,
        bottom: 250,
        left: 80,
      },
      animated: true,
    });
  }, [driverLocation, pickupCoords]);

  // 🚨 ARRIVAL CHECK (40m trigger → write Firebase)
  useEffect(() => {
    if (!driverLocation || !pickupCoords || hasArrivedRef.current) return;

    const distance = getDistanceMeters(
      driverLocation.latitude,
      driverLocation.longitude,
      pickupCoords.latitude,
      pickupCoords.longitude
    );

    console.log("Distance to pickup:", distance);

    if (distance <= 30) {
      hasArrivedRef.current = true;

      set(
        ref(
          faidaDb,
          `KandoFaida/mobility_partners/${driver.mp_id}/status/state`
        ),
        "arrived"
      );
    }
  }, [driverLocation]);

  // 🚀 LISTEN FOR ARRIVAL → GO TO TRIP SCREEN
  useEffect(() => {
    const statusRef = ref(
      faidaDb,
      `KandoFaida/mobility_partners/${driver.mp_id}/status/state`
    );

    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const state = snapshot.val();

      console.log("Driver state:", state);

      if (state === "arrived" && !hasNavigatedRef.current) {
  hasNavigatedRef.current = true;
        set(
          ref(
            faidaDb,
            `KandoFaida/mobility_partners/${driver.mp_id}/status/state`
          ),
          "trip_started"
        );

        navigation.replace("Trip", {
          driver,
          rideData,
          pickupLocation,
          destination,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  if (!driverLocation || !pickupCoords) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading driver location...
        </Text>
      </View>
    );
  }

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
        {/* 🚗 DRIVER */}
        <Marker
          coordinate={driverLocation}
          anchor={{ x: 0.5, y: 1 }}
          title={driver.full_name}
        >
          <View style={styles.markerContainer}>
            <Image
              source={vehicleImage}
              style={styles.markerImage}
              resizeMode="contain"
            />
          </View>
        </Marker>

        {/* 📍 PICKUP */}
        <Marker coordinate={pickupCoords} title="Pickup Point" />

        {/* ROUTE */}
        <MapViewDirections
          origin={driverLocation}
          destination={pickupCoords}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={5}
          strokeColor="black"
          precision="high"
        />
      </MapView>

      {/* INFO CARD */}
      <View style={styles.infoCard}>
        <Text style={styles.title}>Driver Confirmed</Text>
        <Text style={styles.name}>{driver.full_name}</Text>

        <Text style={styles.info}>Vehicle: {rideData.type}</Text>
        <Text style={styles.info}>
          ETA: {rideData.pickupEta} min
        </Text>
        <Text style={styles.info}>
          Fare: TSh {rideData.fare}
        </Text>

        <Text style={styles.approaching}>
          Driver is approaching your pickup point...
        </Text>
      </View>
    </View>
  );
};

export default DriverApproachingScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: { fontSize: 18 },

  infoCard: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 30,
    backgroundColor: "rgba(34,197,94,0.85)",
    padding: 20,
    borderRadius: 20,
  },

  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  name: { color: "#fff", fontSize: 18 },
  info: { color: "#fff", fontSize: 16 },
  approaching: { color: "#fff", fontSize: 15, marginTop: 10 },

  markerContainer: {
  width: 50,
  height: 50,
  alignItems: "center",
  justifyContent: "center",
},

markerImage: {
  width: 40,
  height: 40,
  resizeMode: "contain",
},
});