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


  // ====================================================
  // CONFIRMATION STATE
  // ====================================================
  //
  // isConfirming:
  // Shows "Finding Driver..."
  //
  // confirmationLocked:
  // The button is permanently disabled after the
  // passenger presses Confirm Pickup.
  //
  // IMPORTANT:
  // confirmationLocked is NEVER turned back to false
  // anywhere in this screen.
  // ====================================================

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);


  const [
    confirmationLocked,
    setConfirmationLocked,
  ] = useState(false);


  // ====================================================
  // ABSOLUTE INSTANT CONFIRMATION LOCK
  // ====================================================
  //
  // This ref is the most important protection against
  // double requests.
  //
  // useRef changes synchronously.
  //
  // Once this becomes true, it NEVER becomes false
  // during the lifetime of this screen.
  //
  // This means a second tap cannot get through even if
  // React has not yet re-rendered the button.
  // ====================================================

  const confirmationLockedRef =
    useRef(false);


  // ====================================================
  // NAVIGATION LOCK
  // ====================================================
  //
  // Prevents navigation from being requested twice.
  // ====================================================

  const navigationStartedRef =
    useRef(false);


  // ====================================================
  // SCREEN MOUNT TRACKER
  // ====================================================

  const isMountedRef =
    useRef(true);


  useEffect(() => {

    isMountedRef.current = true;

    return () => {

      isMountedRef.current = false;

    };

  }, []);


  // ====================================================
  // USE CURRENT LOCATION
  // ====================================================

  const useCurrentLocation =
    async () => {

      // Never allow location changes after
      // confirmation has started.

      if (
        confirmationLockedRef.current
      ) {

        console.log(
          "⚠️ CONFIRMATION LOCKED - LOCATION CHANGE IGNORED"
        );

        return;

      }


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

      // ==================================================
      // ABSOLUTE FIRST CHECK
      // ==================================================
      //
      // DO NOT put any await before this check.
      //
      // If confirmation has already started OR navigation
      // has already started, this function immediately
      // rejects the tap.
      //
      // The ref check happens synchronously.
      // ==================================================

      if (
        confirmationLockedRef.current ||
        navigationStartedRef.current
      ) {

        console.log(
          "🚫🚫🚫 CONFIRM PICKUP IS ALREADY LOCKED"
        );

        console.log(
          "🚫 SECOND REQUEST IS IGNORED"
        );

        return;

      }


      // ==================================================
      // PERMANENT LOCK
      // ==================================================
      //
      // These happen immediately.
      //
      // The ref locks synchronously BEFORE the first
      // await in this function.
      //
      // React state locks the visible button.
      //
      // IMPORTANT:
      // We NEVER set confirmationLockedRef.current
      // back to false.
      // ==================================================

      confirmationLockedRef.current =
        true;

      setConfirmationLocked(true);

      setIsConfirming(true);


      console.log(
        "=================================================="
      );

      console.log(
        "🔒🔒🔒 CONFIRM PICKUP PERMANENTLY LOCKED"
      );

      console.log(
        "🔒 SECOND TAP WILL NEVER BE ACCEPTED"
      );

      console.log(
        "=================================================="
      );


      // ==================================================
      // AUTH
      // ==================================================

      const user =
        auth().currentUser;


      if (!user) {

        console.log(
          "❌ NO LOGGED IN USER"
        );

        /*
         * IMPORTANT:
         *
         * DO NOT UNLOCK.
         *
         * The confirmation has already been consumed.
         * The user can go back Home and start again.
         */

        if (
          isMountedRef.current
        ) {

          setIsConfirming(false);

        }

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


      // ==================================================
      // VALIDATION
      // ==================================================

      if (!pickupLocation) {

        console.log(
          "❌ PICKUP LOCATION MISSING"
        );

        if (
          isMountedRef.current
        ) {

          setIsConfirming(false);

        }

        return;

      }


      if (!destination) {

        console.log(
          "❌ DESTINATION MISSING"
        );

        if (
          isMountedRef.current
        ) {

          setIsConfirming(false);

        }

        return;

      }


      if (!selectedRide) {

        console.log(
          "❌ SELECTED RIDE MISSING"
        );

        if (
          isMountedRef.current
        ) {

          setIsConfirming(false);

        }

        return;

      }


      try {

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

          throw new Error(
            "Empty server response"
          );

        }


        if (
          result.data.success === false
        ) {

          throw new Error(
            result.data.message ||
            "Driver matching failed"
          );

        }


        // ==============================================
        // REQUEST ID
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

          throw new Error(
            `Selected ride data not found: ${selectedRide}`
          );

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

          // Preserve existing fields
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

        if (
          isMountedRef.current
        ) {

          setCurrentRideData(
            searchingRideData
          );

        }


        // ==============================================
        // PREVENT DUPLICATE NAVIGATION
        // ==============================================

        if (
          navigationStartedRef.current
        ) {

          console.log(
            "🚫 NAVIGATION ALREADY STARTED - IGNORING"
          );

          return;

        }


        navigationStartedRef.current =
          true;


        // ==============================================
        // NAVIGATION
        // ==============================================

        console.log("");

        console.log(
          "🔒 CONFIRMATION REMAINS PERMANENTLY LOCKED"
        );

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

        console.log(
          "🔒 CONFIRM PICKUP REMAINS LOCKED"
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


        // ==================================================
        // VERY IMPORTANT
        // ==================================================
        //
        // DO NOT DO THIS:
        //
        // confirmationLockedRef.current = false;
        // setConfirmationLocked(false);
        //
        // DO NOT UNLOCK THE BUTTON.
        //
        // The passenger has already confirmed the ride.
        // They must not be able to send another request
        // from this screen.
        // ==================================================

        console.log(
          "🔒🔒🔒 CONFIRM PICKUP REMAINS PERMANENTLY LOCKED"
        );

        console.log(
          "🚫 USER CANNOT SUBMIT ANOTHER REQUEST"
        );


        if (
          isMountedRef.current
        ) {

          setIsConfirming(false);

        }

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

          draggable={
            !confirmationLocked
          }

          coordinate={
            pickupLocation
          }

          title="Pick Me From Here"

          description="Drag to change pickup point"

          onDragEnd={
            (event) => {

              // NEVER allow pickup movement after
              // confirmation has started.

              if (
                confirmationLockedRef.current
              ) {

                console.log(
                  "🚫 PICKUP MOVEMENT BLOCKED"
                );

                return;

              }


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

          {isConfirming
            ? "Finding your driver..."
            : confirmationLocked
            ? "Confirmation submitted"
            : "Confirm pickup location"
          }

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

          style={[
            styles.locationButton,

            confirmationLocked &&
              styles.disabledButton,
          ]}

          onPress={
            useCurrentLocation
          }

          disabled={
            confirmationLocked
          }

          activeOpacity={
            confirmationLocked
              ? 1
              : 0.7
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


        {/* ==================================================
            CONFIRM PICKUP
        ================================================== */}

        <TouchableOpacity

          style={[

            styles.confirmButton,

            (
              confirmationLocked ||
              isConfirming
            ) &&
              styles.disabledButton,

          ]}

          onPress={
            confirmPickup
          }

          disabled={
            confirmationLocked ||
            isConfirming
          }

          activeOpacity={
            (
              confirmationLocked ||
              isConfirming
            )
              ? 1
              : 0.7
          }

        >

          <Text
            style={
              styles.buttonText
            }
          >

            {isConfirming
              ? "Finding Driver..."
              : confirmationLocked
              ? "Confirmation Submitted"
              : "Confirm Pickup"
            }

          </Text>

        </TouchableOpacity>


        {/* ==================================================
            BACK HOME
        ================================================== */}

        <TouchableOpacity

          style={
            styles.backButton
          }

          onPress={() => {

            /*
             * Back Home is blocked while the request
             * is actively being submitted.
             *
             * If the request fails, isConfirming becomes
             * false but confirmationLocked stays true,
             * allowing the passenger to leave this screen
             * without being able to submit another request.
             */

            if (
              isConfirming
            ) {

              console.log(
                "🚫 REQUEST STILL PROCESSING - BACK HOME BLOCKED"
              );

              return;

            }


            navigation.navigate(
              "Home"
            );

          }}

          disabled={
            isConfirming
          }

          activeOpacity={
            isConfirming
              ? 1
              : 0.7
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