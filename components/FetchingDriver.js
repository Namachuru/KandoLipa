import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import auth from "@react-native-firebase/auth";

import {
  lipaFunctions,
} from "../firebase/firebase";

import MapView, {
  Marker,
} from "react-native-maps";

import MapViewDirections from
  "react-native-maps-directions";

import * as Location from "expo-location";

import Constants from "expo-constants";


// ======================================================
// FETCHING DRIVER
// ======================================================

const FetchingDriver = ({
  navigation,
  route,
}) => {

  // ====================================================
  // ROUTE PARAMETERS
  // ====================================================

  const {
    userLocation,
    destination,
    selectedRide,
    rideData,
  } = route.params || {};


  // ====================================================
  // MAP
  // ====================================================

  const mapRef =
    useRef(null);


  const GOOGLE_MAPS_APIKEY =
    Constants.expoConfig?.extra
      ?.GOOGLE_MAPS_APIKEY;


  // ====================================================
  // STATE
  // ====================================================

  const [
    pickupLocation,
    setPickupLocation,
  ] = useState(
    userLocation
  );


  const [
    currentRideData,
    setCurrentRideData,
  ] = useState(
    rideData
  );


  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);


  // ====================================================
  // USE CURRENT LOCATION
  // ====================================================

  const useCurrentLocation =
    async () => {

      try {

        const {
          status,
        } =
          await Location.requestForegroundPermissionsAsync();


        if (
          status !== "granted"
        ) {

          console.log(
            "❌ LOCATION PERMISSION DENIED"
          );

          return;

        }


        const location =
          await Location.getCurrentPositionAsync({

            accuracy:
              Location.Accuracy.Highest,

          });


        const newLocation = {

          latitude:
            location.coords.latitude,

          longitude:
            location.coords.longitude,

        };


        console.log(
          "📍 NEW PICKUP LOCATION:",
          newLocation
        );


        setPickupLocation(
          newLocation
        );


        mapRef.current?.animateToRegion(

          {

            latitude:
              newLocation.latitude,

            longitude:
              newLocation.longitude,

            latitudeDelta:
              0.01,

            longitudeDelta:
              0.01,

          },

          1000

        );

      } catch (error) {

        console.log(
          "❌ LOCATION ERROR:",
          error
        );

      }

    };


  // ====================================================
  // FIT MAP
  // ====================================================

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

          edgePadding: {

            top: 100,
            right: 50,
            bottom: 250,
            left: 50,

          },

          animated: true,

        }

      );

    }

  }, [
    pickupLocation,
    destination,
  ]);


  // ====================================================
  // CONFIRM PICKUP
  // ====================================================

  const confirmPickup =
    async () => {

      // ------------------------------------------------
      // PREVENT DOUBLE TAP
      // ------------------------------------------------

      if (isConfirming) {

        console.log(
          "⚠️ MATCH DRIVER ALREADY RUNNING"
        );

        return;

      }


      // ------------------------------------------------
      // AUTH
      // ------------------------------------------------

      const user =
        auth().currentUser;


      if (!user) {

        console.log(
          "❌ NO LOGGED IN USER"
        );

        return;

      }


      const clientId =
        user.uid;


      console.log("");
      console.log(
        "=================================================="
      );

      console.log(
        "🔥 CONFIRM PICKUP CLICKED"
      );

      console.log(
        "=================================================="
      );

      console.log(
        "👤 CLIENT ID:",
        clientId
      );

      console.log(
        "📍 PICKUP:",
        pickupLocation
      );

      console.log(
        "🏁 DESTINATION:",
        destination
      );

      console.log(
        "🚘 SELECTED RIDE:",
        selectedRide
      );


      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

      if (!pickupLocation) {

        console.log(
          "❌ PICKUP LOCATION MISSING"
        );

        return;

      }


      if (!destination) {

        console.log(
          "❌ DESTINATION MISSING"
        );

        return;

      }


      if (!selectedRide) {

        console.log(
          "❌ SELECTED RIDE MISSING"
        );

        return;

      }


      try {

        setIsConfirming(true);


        // ==============================================
        // CALL SERVER
        // ==============================================

        console.log(
          "🔥 CALLING MATCH DRIVER"
        );


        const matchDriver =
          lipaFunctions.httpsCallable(
            "matchDriver"
          );


        const result =
          await matchDriver({

            userLocation:
              pickupLocation,

            destination,

            selectedRide,

            clientId,

          });


        // ==============================================
        // SERVER RESPONSE
        // ==============================================

        console.log("");

        console.log(
          "🔥🔥🔥 MATCH DRIVER SERVER RESPONSE"
        );

        console.log(
          result?.data
        );


        if (!result?.data) {

          console.log(
            "❌ EMPTY SERVER RESPONSE"
          );

          return;

        }


        if (
          result.data.success === false
        ) {

          console.log(
            "❌ SERVER REPORTED FAILURE:",
            result.data
          );

          return;

        }


        // ==============================================
        // REQUEST ID
        //
        // Preserve it if server supplied one.
        // DO NOT BLOCK NAVIGATION if it isn't supplied.
        // ==============================================

        const serverRequestId =
          result.data.request_id ||
          result.data.requestId ||
          rideData?.request_id ||
          rideData?.requestId ||
          null;


        console.log(
          "🆔 REQUEST ID:",
          serverRequestId
        );


        if (!serverRequestId) {

          console.log(
            "⚠️ NO REQUEST ID IN MATCH DRIVER RESPONSE"
          );

          console.log(
            "⚠️ CONTINUING TO SEARCHING DRIVER"
          );

        }


        // ==============================================
        // GET SELECTED VEHICLE DATA
        // ==============================================

        const selectedData =
          result.data[selectedRide];


        if (!selectedData) {

          console.log(
            "❌ SELECTED RIDE DATA NOT FOUND:",
            selectedRide
          );

          console.log(
            "AVAILABLE SERVER DATA:",
            result.data
          );

          return;

        }


        console.log(
          "✅ SELECTED RIDE DATA:",
          selectedData
        );


        // ==============================================
        // BUILD RIDE DATA
        // ==============================================

        const searchingRideData = {

          ...selectedData,

          // Preserve existing fields from rideData
          ...rideData,

          // Server response gets priority
          ...selectedData,

          // Preserve request ID if available
          ...(serverRequestId
            ? {
                request_id:
                  serverRequestId,
              }
            : {}),

        };


        console.log("");

        console.log(
          "=================================================="
        );

        console.log(
          "📦 SEARCHING DRIVER DATA"
        );

        console.log(
          "=================================================="
        );

        console.log(
          searchingRideData
        );

        console.log(
          "🚗 DRIVER:",
          searchingRideData?.winner
        );

        console.log(
          "🆔 REQUEST ID:",
          searchingRideData?.request_id
        );


        // ==============================================
        // SAVE LOCALLY
        // ==============================================

        setCurrentRideData(
          searchingRideData
        );


        // ==============================================
        // NAVIGATION
        //
        // IMPORTANT:
        // Navigation is NOT blocked by request_id.
        // ==============================================

        console.log("");

        console.log(
          "🚀🚀🚀 NAVIGATING TO SEARCHING DRIVER"
        );


        navigation.navigate(

          "SearchingDriver",

          {

            pickupLocation,

            destination,

            selectedRide,

            rideData:
              searchingRideData,

          }

        );


        console.log(
          "✅ NAVIGATION SENT"
        );


      } catch (error) {

        console.log("");

        console.log(
          "❌❌❌ MATCH DRIVER ERROR"
        );

        console.log(
          "ERROR:",
          error
        );

        console.log(
          "CODE:",
          error?.code
        );

        console.log(
          "MESSAGE:",
          error?.message
        );

        console.log(
          "DETAILS:",
          error?.details
        );


      } finally {

        setIsConfirming(
          false
        );

      }

    };


  // ====================================================
  // LOADING
  // ====================================================

  if (!pickupLocation) {

    return (

      <View
        style={
          styles.loading
        }
      >

        <Text>
          Loading map...
        </Text>

      </View>

    );

  }


  // ====================================================
  // UI
  // ====================================================

  return (

    <View
      style={
        styles.container
      }
    >

      <MapView

        ref={
          mapRef
        }

        style={
          styles.map
        }

        initialRegion={{

          latitude:
            pickupLocation.latitude,

          longitude:
            pickupLocation.longitude,

          latitudeDelta:
            0.01,

          longitudeDelta:
            0.01,

        }}

      >

        {/* PICKUP */}

        <Marker

          draggable

          coordinate={
            pickupLocation
          }

          title="Pick Me From Here"

          description="Drag to change pickup point"

          onDragEnd={
            (event) => {

              setPickupLocation(
                event.nativeEvent.coordinate
              );

            }
          }

        />


        {/* DESTINATION */}

        {destination && (

          <Marker

            coordinate={
              destination
            }

            pinColor="green"

            title="Destination"

          />

        )}


        {/* ROUTE */}

        {destination && (

          <MapViewDirections

            origin={
              pickupLocation
            }

            destination={
              destination
            }

            apikey={
              GOOGLE_MAPS_APIKEY
            }

            strokeWidth={5}

            strokeColor="black"

          />

        )}

      </MapView>


      {/* ==================================================
          BOTTOM CARD
      ================================================== */}

      <View
        style={
          styles.bottomCard
        }
      >

        <Text
          style={
            styles.title
          }
        >

          {selectedRide}

        </Text>


        <Text
          style={
            styles.subtitle
          }
        >

          Confirm pickup location

        </Text>


        {/* FARE */}

        {currentRideData?.fare != null && (

          <Text
            style={
              styles.fare
            }
          >

            Fare: TSh{" "}

            {Number(
              currentRideData.fare
            ).toLocaleString()}

          </Text>

        )}


        {/* REQUEST ID */}

        {currentRideData?.request_id && (

          <Text
            style={
              styles.requestId
            }
          >

            Request:{" "}
            {currentRideData.request_id}

          </Text>

        )}


        {/* MY LOCATION */}

        <TouchableOpacity

          style={
            styles.locationButton
          }

          onPress={
            useCurrentLocation
          }

          disabled={
            isConfirming
          }

        >

          <Text
            style={
              styles.buttonText
            }
          >

            My Location

          </Text>

        </TouchableOpacity>


        {/* CONFIRM PICKUP */}

        <TouchableOpacity

          style={[

            styles.confirmButton,

            isConfirming &&
              styles.disabledButton,

          ]}

          onPress={
            confirmPickup
          }

          disabled={
            isConfirming
          }

        >

          <Text
            style={
              styles.buttonText
            }
          >

            {isConfirming
              ? "Finding Driver..."
              : "Confirm Pickup"
            }

          </Text>

        </TouchableOpacity>


        {/* BACK HOME */}

        <TouchableOpacity

          style={
            styles.backButton
          }

          onPress={() =>
            navigation.navigate(
              "Home"
            )
          }

          disabled={
            isConfirming
          }

        >

          <Text
            style={
              styles.buttonText
            }
          >

            ⬅ Back Home

          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

};


// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
    },

    map: {
      flex: 1,
    },

    loading: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    bottomCard: {
      position:
        "absolute",
      bottom:
        20,
      left:
        15,
      right:
        15,
      backgroundColor:
        "white",
      borderRadius:
        15,
      padding:
        20,
      elevation:
        5,
      shadowOpacity:
        0.2,
      shadowRadius:
        5,
    },

    title: {
      fontSize:
        22,
      fontWeight:
        "bold",
    },

    subtitle: {
      marginTop:
        5,
      opacity:
        0.6,
    },

    fare: {
      fontSize:
        24,
      fontWeight:
        "bold",
      marginTop:
        15,
    },

    requestId: {
      fontSize:
        11,
      marginTop:
        5,
      opacity:
        0.5,
    },

    locationButton: {
      marginTop:
        15,
      padding:
        15,
      borderRadius:
        10,
      alignItems:
        "center",
      backgroundColor:
        "#d9f99d",
    },

    confirmButton: {
      marginTop:
        10,
      padding:
        15,
      borderRadius:
        10,
      alignItems:
        "center",
      backgroundColor:
        "#a5e75a",
    },

    disabledButton: {
      opacity:
        0.5,
    },

    backButton: {
      marginTop:
        10,
      padding:
        15,
      borderRadius:
        10,
      alignItems:
        "center",
      backgroundColor:
        "#fde68a",
    },

    buttonText: {
      fontWeight:
        "bold",
    },

  });


export default FetchingDriver;

