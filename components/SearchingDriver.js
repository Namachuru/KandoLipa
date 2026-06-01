import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import Constants from "expo-constants";

const SearchingDriver = ({ route }) => {
  const {
    pickupLocation,
    destination,
    selectedRide,
    rideData,
  } = route.params || {};

  const pulse = useRef(new Animated.Value(1)).current;

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

  if (!pickupLocation || !destination) {
    return (
      <View style={styles.center}>
        <Text>Missing trip data...</Text>
      </View>
    );
  }

  const driver = rideData?.winner;

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

      {/* BOTTOM CARD */}
      <View style={styles.card}>

        <Text style={styles.title}>
          Finding Driver for {selectedRide}
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
});