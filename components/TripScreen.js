import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import Constants from "expo-constants";
import { ref, onValue, set } from "firebase/database";
import { faidaDb } from "../firebase/firebase";
import { useNavigation } from "@react-navigation/native";
import { pricingRegistry } from "./data/pricing";

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;

const calculateFare = (distanceKm, rideType) => {
  let baseFare = 1000;
  let perKm = 500;

  switch (rideType) {
    case "Roka":
      baseFare = 1000;
      perKm = 400;
      break;

    case "Wea":
      baseFare = 1500;
      perKm = 600;
      break;

    case "Mchoro":
      baseFare = 2000;
      perKm = 800;
      break;
  }

  return Math.round(baseFare + distanceKm * perKm);
};

const TripScreen = ({ route }) => {
  const {
    driver,
    pickupLocation,
    destination,
    rideData,
  } = route.params;

  const navigation = useNavigation();
  const mapRef = useRef(null);
  const tripStartTimeRef = useRef(Date.now());
  const [actualDistanceKm, setActualDistanceKm] = useState(0);

  const [driverLocation, setDriverLocation] = useState(null);
  const [distanceLeft, setDistanceLeft] = useState(null);
  const [eta, setEta] = useState(null);
  const [tripEnded, setTripEnded] = useState(false);

  const [arrivalCount, setArrivalCount] = useState(0);
  const rates = pricingRegistry.TZ[rideData.type];

  const vehicleImage =
    rideData.type === "Roka"
      ? require("../assets/weari/roka_satelite.png")
      : rideData.type === "Wea"
      ? require("../assets/weari/wea_satelite.png")
      : rideData.type === "Mchoro"
      ? require("../assets/weari/mchoro_satelite.png")
      : require("../assets/weari/wea_satelite.png");
    
  /* ---------------- DRIVER LIVE LOCATION (IMPROVED) ---------------- */
  useEffect(() => {
    const locationRef = ref(
      faidaDb,
      `KandoFaida/mobility_partners/${driver.mp_id}/location`
    );

    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const loc = snapshot.val();

      if (!loc?.lat || !loc?.lng) return;

      // ❌ ignore bad GPS accuracy
      if (loc?.accuracy && loc.accuracy > 25) {
        console.log("Bad GPS ignored:", loc.accuracy);
        return;
      }

      setDriverLocation((prev) => {
  const newPoint = {
    latitude: loc.lat,
    longitude: loc.lng,
  };

  if (prev) {
    const segmentMeters = getDistanceMeters(
      prev.latitude,
      prev.longitude,
      newPoint.latitude,
      newPoint.longitude
    );

    setActualDistanceKm(
      (oldDistance) => oldDistance + segmentMeters / 1000
    );
  }

  if (!prev) return newPoint;

  return {
    latitude: prev.latitude * 0.6 + newPoint.latitude * 0.4,
    longitude: prev.longitude * 0.6 + newPoint.longitude * 0.4,
  };
});
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- AUTO FIT MAP ---------------- */
  useEffect(() => {
    if (!driverLocation || !destination) return;

    mapRef.current?.fitToCoordinates(
      [driverLocation, destination],
      {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 200,
          left: 50,
        },
        animated: true,
      }
    );
  }, [driverLocation, destination]);

  /* ---------------- DISTANCE FUNCTION ---------------- */
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

  /* ---------------- ARRIVAL LOGIC (STABLE) ---------------- */
  useEffect(() => {
    if (!driverLocation || !destination || tripEnded) return;

    const distance = getDistanceMeters(
      driverLocation.latitude,
      driverLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    // 🔥 relaxed threshold (fixes 80m GPS drift issue)
    if (distance <= 100) {
      setArrivalCount((prev) => prev + 1);
    } else {
      setArrivalCount(0);
    }

    // ✔ confirm arrival only after stable readings
    if (arrivalCount >= 3) {
      setTripEnded(true);

      set(
        ref(
          faidaDb,
          `KandoFaida/mobility_partners/${driver.mp_id}/status/state`
        ),
        "completed"
      );

      const actualMinutes =
  (Date.now() - tripStartTimeRef.current) / 60000;

const finalFare = Math.max(
  rates.minimumFare,
  Math.round(
    rates.baseFare +
      actualDistanceKm * rates.perKm +
      actualMinutes * rates.perMinute
  )
);

      navigation.replace("Arrived", {
        driver,
        rideData,
        finalFare,
        actualDistanceKm,
        actualMinutes,
      });
    }
  }, [driverLocation, arrivalCount]);

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
        {/* DRIVER */}
        <Marker coordinate={driverLocation} style={styles.markerContainer}>
          <Image source={vehicleImage} style={styles.markerImage} />
        </Marker>

        {/* DESTINATION */}
        <Marker
          coordinate={destination}
          title="Destination"
          pinColor="green"
        />

        {/* ROUTE */}
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

      {/* INFO CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Trip in Progress</Text>

        <Text style={styles.info}>
          Destination: {rideData.destinationName || "Drop-off"}
        </Text>

        <Text style={styles.big}>
          {distanceLeft ? distanceLeft.toFixed(1) : "--"} km remaining
        </Text>

        <Text style={styles.info}>
          ETA: {eta || "--"} min
        </Text>

        <Text style={styles.fare}>
          Fare will be calculated at end of trip
        </Text>
      </View>
    </View>
  );
};

export default TripScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    position: "absolute",
    bottom: 25,
    left: 15,
    right: 15,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    elevation: 5,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    fontSize: 15,
    marginBottom: 4,
  },

  big: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 6,
  },

  fare: {
    marginTop: 10,
    fontSize: 13,
    opacity: 0.6,
  },

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