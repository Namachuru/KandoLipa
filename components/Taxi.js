import { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator } from "react-native";

import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

const Taxi = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get user GPS location when screen loads
  useEffect(() => {
    const getLocation = async () => {
      // Ask permission
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Permission denied! Location is needed for Taxi.");
        setLoading(false);
        return;
      }

      // Get current position
      let location = await Location.getCurrentPositionAsync({});

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setLoading(false);
    };

    getLocation();
  }, []);

  const handleBack = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kando Taxi 🚖</Text>

      {/* Show loading while location loads */}
      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : userLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Marker for user */}
          <Marker
            coordinate={userLocation}
            title="You are here"
            description="Current Location"
          />
        </MapView>
      ) : (
        <Text>Location not available</Text>
      )}

      {/* Back button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Back Home"
          onPress={handleBack}
          color="rgb(165, 231, 90)"
        />
      </View>
    </View>
  );
};

export default Taxi;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(255, 232, 94)",
    paddingTop: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "black",
  },

  map: {
    flex: 1,
    width: "100%",
    borderRadius: 20,
  },

  buttonContainer: {
    padding: 15,
  },
});
