import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  TouchableOpacity,
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import Constants from "expo-constants";

import { ref, onValue, set } from "firebase/database";
import { faidaDb } from "../firebase/firebase";

const SearchingDriver = ({ route, navigation }) => {
  const {
    pickupLocation,
    destination,
    selectedRide,
    rideData,
  } = route.params || {};

  const driver = rideData?.winner ?? null;

  const pulse = useRef(new Animated.Value(1)).current;

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Listen for driver response (accepted)
  useEffect(() => {
    if (!driver?.mp_id) return;

    const path = `KandoFaida/mobility_partners/${driver.mp_id}/status/state`;
    console.log("LISTENING TO:", path);

    const stateRef = ref(faidaDb, path);

    const unsubscribe = onValue(stateRef, (snapshot) => {
      const state = snapshot.val();

      console.log("DRIVER STATE:", state);

      if (state === "accepted") {
        console.log("Driver accepted. Navigating...");

        navigation.replace("DriverApproaching", {
          driver,
          pickupLocation,
          destination,
          rideData,
        });
      }
    });

    return () => unsubscribe();
  }, [driver]);

  // Timeout if no driver accepts
  useEffect(() => {
    if (rideData?.winner) {
      return;
    }

    const timeout = setTimeout(() => {
      Alert.alert(
        "No Driver Found",
        "No driver accepted your request."
      );

      navigation.navigate("Taxi");
    }, 20000);

    return () => clearTimeout(timeout);
  }, [rideData, navigation]);

  // Send request (THIS is where pending is written)
  const sendRequestToDriver = async () => {
    if (!driver?.mp_id) return;

    try {
      const path = `KandoFaida/mobility_partners/${driver.mp_id}/status/state`;

      console.log("WRITING:", path);

      await set(ref(faidaDb, path), "pending");

      console.log("PENDING WRITTEN");
    } catch (error) {
      console.log("WRITE ERROR:", error);
    }
  };

  if (!pickupLocation || !destination) {
    return (
      <View style={styles.center}>
        <Text>Missing trip data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={pickupLocation} title="Pickup" />
        <Marker coordinate={destination} title="Destination" pinColor="green" />

        <MapViewDirections
          origin={pickupLocation}
          destination={destination}
          apikey={Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY}
          strokeWidth={4}
          strokeColor="black"
        />

        {driver?.location && (
          <Marker
            coordinate={{
              latitude: driver.location.lat,
              longitude: driver.location.lng,
            }}
            title="Driver"
          />
        )}
      </MapView>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>
          Finding {selectedRide} Driver
        </Text>

        {driver ? (
          <>
            <Text style={styles.driverName}>
              🚗 {driver.full_name}
            </Text>

            <Text style={styles.info}>
              📍 Distance: {driver.distance?.toFixed(2)} km
            </Text>

            <Text style={styles.info}>
              💰 Fare: TSh {rideData?.fare}
            </Text>

            <Text style={styles.info}>
              ⏱ ETA: {rideData?.pickupEta} min
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={sendRequestToDriver}
            >
              <Text style={styles.confirmText}>
                Confirm Request
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.loadingBox}>
            <Animated.View
              style={[
                styles.pulse,
                { transform: [{ scale: pulse }] },
              ]}
            />
            <Text style={styles.loadingText}>
              Searching for best driver...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default SearchingDriver;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  driverName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },

  info: {
    fontSize: 16,
    marginBottom: 4,
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: 20,
  },

  pulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "green",
    marginBottom: 10,
  },

  loadingText: {
    opacity: 0.6,
  },

  confirmButton: {
    marginTop: 15,
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  confirmText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});