import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebase";
import { auth } from "../firebase/firebase";

import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
import Constants from "expo-constants";

const FetchingDriver = ({ navigation, route }) => {

  const {
    userLocation,
    destination,
    selectedRide,
    rideData,
  } = route.params || {};

  const mapRef = useRef(null);

  const GOOGLE_MAPS_APIKEY =
    Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;

  const [pickupLocation, setPickupLocation] =
    useState(userLocation);

   const [currentRideData, setCurrentRideData] =
    useState(rideData);


  const useCurrentLocation = async () => {

    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });


    const newLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setPickupLocation(newLocation);

    mapRef.current?.animateToRegion(
      {
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  useEffect(() => {

    if (
      mapRef.current &&
      pickupLocation &&
      destination
    ) {

      mapRef.current.fitToCoordinates(
        [
          pickupLocation,
          destination,
        ],
        {
          edgePadding:{
            top:100,
            right:50,
            bottom:250,
            left:50,
          },
          animated:true,
        }
      );

    }

  }, [
    pickupLocation,
    destination
  ]);

  const confirmPickup = async () => {

    const user = auth.currentUser;
    
    if (!user) {
      console.log("No logged in user");
      return;
    }


    const clientId = user.uid;

    console.log(
      "CLIENT ID:",
      clientId
    );

    console.log("🔥 CONFIRM PICKUP CLICKED");

    try {

      const matchDriver =
        httpsCallable(
          functions,
          "matchDriver"
        );

      console.log("🔥 CALLING MATCH DRIVER");

      const result =
        await matchDriver({
          userLocation: pickupLocation,
          destination,
          selectedRide,
          clientId,
        });


      console.log(
        "🔥 SERVER RESPONSE:",
        result.data
      );


      const selectedData =
        result.data.options[selectedRide];


      navigation.navigate(
        "SearchingDriver",
        {
          pickupLocation,
          destination,
          selectedRide,
          rideData:{
            ...selectedData,
            requestId: result.data.requestId
          }
        }
      );


      console.log("🔥 NAVIGATION SENT");
    } catch(error){

      console.log(
        "Matching error:",
        error
      );

    }

  };

  if (!pickupLocation) {
    return (
      <View style={styles.loading}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude:
            pickupLocation.latitude,
          longitude:
            pickupLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >

        {/* PICKUP */}
        <Marker
          draggable
          coordinate={pickupLocation}
          title="Pick Me From Here"
          description="Drag to change pickup point"
          onDragEnd={(e) =>
            setPickupLocation(
              e.nativeEvent.coordinate
            )
          }
        />

        {/* DESTINATION */}
        {destination && 
          <Marker
            coordinate={destination}
            pinColor="green"
            title="Destination"
          />
        }

        {/* ROUTE */}
        {destination && 
          <MapViewDirections
            origin={pickupLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={5}
            strokeColor="black"
          />
        }

      </MapView>

      <View style={styles.bottomCard}>

        <Text style={styles.title}>
          {selectedRide}
        </Text>

        <Text style={styles.subtitle}>
          Confirm pickup location
        </Text>

        {
          currentRideData?.fare &&

          <Text style={styles.fare}>
            Fare: TSh {currentRideData.fare.toLocaleString()}
          </Text>

        }
        <TouchableOpacity
          style={styles.locationButton}
          onPress={useCurrentLocation}
        >
          <Text style={styles.buttonText}>
            My Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={confirmPickup}
        >
          <Text style={styles.buttonText}>
            Confirm Pickup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.navigate("Home")
          }
        >
          <Text style={styles.buttonText}>
            ⬅ Back Home
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 5,
    opacity: 0.6,
  },

  fare: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
  },

  locationButton: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#d9f99d",
  },

  confirmButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#a5e75a",
  },

  backButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fde68a",
  },

  buttonText: {
    fontWeight: "bold",
  },
});

export default FetchingDriver;