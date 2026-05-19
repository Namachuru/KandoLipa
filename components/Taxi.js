import 'react-native-get-random-values';
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

const Taxi = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  // Ride selection
  const [rideFor, setRideFor] = useState("me");

  const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;
  console.log("API KEY:", GOOGLE_MAPS_APIKEY);

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

  useEffect(() => {
    console.log("User location:", userLocation);
    console.log("Destination:", destination);
  }, [destination, userLocation]);

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
            coordinate={userLocation}
            title="You are here"
          />

          {/* DESTINATION MARKER */}
          {destination && <Marker coordinate={destination} />}

          {/* ROUTE LINE */}
          {destination && userLocation && (
            <MapViewDirections
              origin={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              destination={destination}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={5}
              strokeColor="black"
              onError={(errorMessage) => {
                console.log("Directions error:", errorMessage);
              }}
            />
          )}
        </MapView>
      )}

      {/* AUTOCOMPLETE SEARCH */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Where to?"
          fetchDetails={true}
          minLength={2}
          debounce={300}
          textInputProps={{
            onChangeText: (text) => console.log("TYPING:", text),
          }}

          onPress={(data, details = null) => {
            console.log("DATA:", data);

            if (!details) return;

            const location = details.geometry.location;

            setDestination({
              latitude: location.lat,
              longitude: location.lng,
            });
          }}

          query={{
            key: GOOGLE_MAPS_APIKEY,
            language: "en",
          }}

          enablePoweredByContainer={false}
          keyboardShouldPersistTaps="handled"

          styles={{
            textInputContainer: {
              width: "100%",
              backgroundColor: "transparent",
            },

            textInput: {
              backgroundColor: "white",
              borderRadius: 10,
              paddingHorizontal: 15,
              fontSize: 16,
              height: 50,
              color: "black",
            },

            listView: {
              backgroundColor: "white",
              borderRadius: 10,
              marginTop: 5,
            },
          }}
        />
      </View>

      {/* ✅ Floating Controls */}
      <View style={styles.topOverlay} pointerEvents="box-none">
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
    zIndex: 0,
  },

  searchContainer: {
    position: "absolute",
    top: 60,
    width: "92%",
    alignSelf: "center",
    zIndex: 99999,
    elevation: 99999,
  },
  
  /* Floating Overlay */
  topOverlay: {
    position: "absolute",
    top: 140,
    width: "100%",
    paddingHorizontal: 15,
    zIndex: 1,
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


