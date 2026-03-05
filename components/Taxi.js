import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const Taxi = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);

  // Ride selection
  const [rideFor, setRideFor] = useState("me");

  // Search destination
  const [destination, setDestination] = useState("");

  // Fetch user location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        alert("Permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    };

    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      {/* ✅ Map Background */}
      {userLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="You are here"
          />
        </MapView>
      )}

      {/* ✅ Floating Controls */}
      <View style={styles.topOverlay}>
        {/* Ride Selection Bar */}
        <View style={styles.selectionBar}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              rideFor === "me" && styles.activeOption,
            ]}
            onPress={() => setRideFor("me")}
          >
            <Text style={styles.optionText}>For Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              rideFor === "other" && styles.activeOption,
            ]}
            onPress={() => setRideFor("other")}
          >
            <Text style={styles.optionText}>For Someone Else</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Let's go somewhere!"
          placeholderTextColor="#444"
          value={destination}
          onChangeText={setDestination}
        />

        {/* ✅ Back Home Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.backText}>⬅ Back Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Taxi;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: "100%",
    height: "100%",
  },

  /* Floating Overlay */
  topOverlay: {
    position: "absolute",
    top: 50,
    width: "100%",
    paddingHorizontal: 15,
  },

  /* Selection Bar */
  selectionBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    elevation: 5,
  },

  optionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },

  activeOption: {
    backgroundColor: "rgb(165, 231, 90)",
  },

  optionText: {
    fontWeight: "600",
    color: "black",
  },

  /* Search Bar */
  searchBar: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    elevation: 5,
    marginBottom: 12,
  },

  /* Back Home Button */
  backButton: {
    backgroundColor: "rgb(255, 232, 94)",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
  },

  backText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
});


