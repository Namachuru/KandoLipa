import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";

import MapView, {
  Marker,
} from "react-native-maps";

import MapViewDirections from "react-native-maps-directions";

import Constants from "expo-constants";

import {
  ref,
  onValue,
} from "@react-native-firebase/database";

import {
  httpsCallable,
} from "@react-native-firebase/functions";

import {
  getFaidaDb,
  lipaFunctions,
} from "../firebase/firebase";


// =========================================================
// GOOGLE MAPS API KEY
// =========================================================

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;


// =========================================================
// DRIVER ARRIVAL DISTANCE
// =========================================================

const ARRIVAL_DISTANCE_METERS = 50;


// =========================================================
// DESTINATION ARRIVAL
// =========================================================

const DESTINATION_DISTANCE_METERS = 60;

const DESTINATION_CONFIRMATIONS = 1;


// =========================================================
// DRIVER MARKER ICONS
// =========================================================

const RIDE_MARKER_ICONS = {
  mchoro: require("../assets/weari/mchoro_satelite.png"),
  roka: require("../assets/weari/roka_satelite.png"),
  wea: require("../assets/weari/wea_satelite.png"),
  zoa: require("../assets/weari/zoa_satelite.png"),
};


// =========================================================
// GET DRIVER MARKER
// =========================================================

const getDriverMarkerIcon = (rideType) => {

  const key =
    String(rideType || "")
      .trim()
      .toLowerCase();

  return (
    RIDE_MARKER_ICONS[key] ||
    RIDE_MARKER_ICONS.mchoro
  );
};


// =========================================================
// DISTANCE CALCULATOR
// =========================================================

const calculateDistanceMeters = (
  point1,
  point2
) => {

  if (!point1 || !point2) {
    return null;
  }

  const lat1 = Number(point1.latitude);
  const lon1 = Number(point1.longitude);

  const lat2 = Number(point2.latitude);
  const lon2 = Number(point2.longitude);

  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const earthRadius = 6371000;

  const dLat =
    (lat2 - lat1) *
    Math.PI /
    180;

  const dLon =
    (lon2 - lon1) *
    Math.PI /
    180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(
      lat1 * Math.PI / 180
    ) *

    Math.cos(
      lat2 * Math.PI / 180
    ) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};


// =========================================================
// SCREEN
// =========================================================

export default function DriverApproachingScreen({
  route,
  navigation,
}) {

  // =======================================================
  // ROUTE PARAMS
  // =======================================================

  const {
    pickupLocation,
    destination,
    selectedRide,
    rideData,
    driver,
    requestId,
  } = route.params || {};


  // =======================================================
  // EFFECTIVE RIDE TYPE
  // =======================================================

  const effectiveRideType =
    selectedRide ||
    rideData?.selectedRide ||
    rideData?.type ||
    driver?.selectedRide ||
    "Mchoro";


  // =======================================================
  // EFFECTIVE MP ID
  // =======================================================

  const mpId =
    driver?.mp_id ||
    driver?.mpId ||
    rideData?.mp_id ||
    null;


  // =======================================================
  // STATE
  // =======================================================

  const [
    driverLocation,
    setDriverLocation,
  ] = useState(null);

  const [
    locationReceived,
    setLocationReceived,
  ] = useState(false);

  const [
    driverArrived,
    setDriverArrived,
  ] = useState(false);

  const [
    distanceToPickup,
    setDistanceToPickup,
  ] = useState(null);


  // =======================================================
  // MAP REF
  // =======================================================

  const mapRef =
    useRef(null);


  // =======================================================
  // IMPORTANT REFS
  // =======================================================

  const driverArrivedRef =
    useRef(false);

  const tripStartedRef =
    useRef(false);

  const tripEndedRef =
    useRef(false);

  const startingTripRef =
    useRef(false);

  const completingTripRef =
    useRef(false);

  const destinationArrivalCountRef =
    useRef(0);

  const previousPointRef =
    useRef(null);

  const actualDistanceKmRef =
    useRef(0);


  // =======================================================
  // DRIVER MARKER IMAGE
  // =======================================================

  const driverMarkerIcon =
    getDriverMarkerIcon(
      effectiveRideType
    );


  // =======================================================
  // DEBUG SCREEN PARAMETERS
  // =======================================================

  useEffect(() => {

    console.log("");
    console.log("==================================================");
    console.log("🚕 DRIVER APPROACHING SCREEN");
    console.log("==================================================");

    console.log(
      "Driver:",
      driver
    );

    console.log(
      "Driver MP ID:",
      driver?.mp_id
    );

    console.log(
      "Ride Data MP ID:",
      rideData?.mp_id
    );

    console.log(
      "FINAL MP ID:",
      mpId
    );

    console.log(
      "Request ID:",
      requestId
    );

    console.log(
      "Pickup:",
      pickupLocation
    );

    console.log(
      "Destination:",
      destination
    );

    console.log(
      "Selected Ride:",
      selectedRide
    );

    console.log(
      "Effective Ride Type:",
      effectiveRideType
    );

    console.log(
      "Driver Marker:",
      driverMarkerIcon
    );

    console.log(
      "Ride Data:",
      rideData
    );

    console.log("==================================================");

  }, []);


  // =======================================================
  // START TRIP ON SERVER
  // =======================================================

  const startTripOnServer = async () => {

    if (tripStartedRef.current) {
      return;
    }

    if (startingTripRef.current) {
      return;
    }

    if (!requestId) {

      console.log(
        "❌ CANNOT START TRIP: NO REQUEST ID"
      );

      return;
    }

    if (!mpId) {

      console.log(
        "❌ CANNOT START TRIP: NO MP ID"
      );

      return;
    }

    startingTripRef.current = true;

    try {

      console.log("");
      console.log("==================================================");
      console.log("🚦 DRIVER REACHED PICKUP");
      console.log("🚦 STARTING TRIP ON SERVER");
      console.log("==================================================");

      console.log(
        "Request ID:",
        requestId
      );

      console.log(
        "MP ID:",
        mpId
      );


      const startTrip =
        httpsCallable(
          lipaFunctions,
          "startTrip"
        );


      const result =
        await startTrip({
          requestId,
          mpId,
        });


      console.log(
        "🔥 START TRIP RESPONSE:",
        result?.data
      );


      if (
        result?.data?.success === false
      ) {

        throw new Error(
          result?.data?.message ||
          "Server rejected trip start"
        );
      }


      tripStartedRef.current =
        true;


      console.log(
        "✅ TRIP STARTED ON SERVER"
      );


    } catch (error) {

      console.log(
        "❌ START TRIP ERROR:",
        error
      );


      startingTripRef.current =
        false;


      Alert.alert(
        "Trip Error",
        "The trip could not be started. Please try again."
      );

    }

  };


  // =======================================================
  // COMPLETE TRIP ON SERVER
  // =======================================================

  const completeTripOnServer = async () => {

    if (tripEndedRef.current) {
      return;
    }

    if (completingTripRef.current) {
      return;
    }

    if (!requestId) {

      console.log(
        "❌ CANNOT COMPLETE TRIP: NO REQUEST ID"
      );

      return;
    }

    if (!mpId) {

      console.log(
        "❌ CANNOT COMPLETE TRIP: NO MP ID"
      );

      return;
    }


    completingTripRef.current =
      true;


    try {

      console.log("");
      console.log("==================================================");
      console.log("🏁 DESTINATION REACHED");
      console.log("🏁 CALLING SERVER completeTrip");
      console.log("==================================================");

      console.log(
        "Request ID:",
        requestId
      );

      console.log(
        "MP ID:",
        mpId
      );

      console.log(
        "Ride Type:",
        effectiveRideType
      );

      console.log(
        "Actual GPS Distance:",
        actualDistanceKmRef.current,
        "km"
      );


      const completeTrip =
        httpsCallable(
          lipaFunctions,
          "completeTrip"
        );


      const result =
        await completeTrip({

          requestId,

          mpId,

          driverId:
            mpId,

          rideType:
            effectiveRideType,

          actualDistanceKm:
            actualDistanceKmRef.current,

        });


      console.log(
        "🔥 COMPLETE TRIP RESPONSE:",
        result?.data
      );


      const data =
        result?.data || {};


      if (
        data.success === false
      ) {

        throw new Error(
          data.message ||
          "Server failed to complete trip"
        );
      }


      // -----------------------------------------------------
      // PREVENT DUPLICATE COMPLETION
      // -----------------------------------------------------

      tripEndedRef.current =
        true;


      // -----------------------------------------------------
      // MAKE SURE ArrivedScreen RECEIVES type
      // -----------------------------------------------------

      const finalRideData = {

        ...(rideData || {}),

        type:
          rideData?.type ||
          rideData?.selectedRide ||
          selectedRide ||
          effectiveRideType,

      };


      // -----------------------------------------------------
      // SERVER VALUES
      // -----------------------------------------------------

      const finalFare =
        Number(
          data.finalFare || 0
        );


      const serverActualMinutes =
        Number(
          data.actualMinutes || 0
        );


      const serverActualDistanceKm =
        Number(
          data.actualDistanceKm ??
          actualDistanceKmRef.current ??
          0
        );


      console.log(
        "=================================================="
      );

      console.log(
        "✅ TRIP COMPLETED"
      );

      console.log(
        "FINAL FARE:",
        finalFare
      );

      console.log(
        "SERVER ACTUAL MINUTES:",
        serverActualMinutes
      );

      console.log(
        "SERVER ACTUAL DISTANCE:",
        serverActualDistanceKm
      );

      console.log(
        "=================================================="
      );


      // -----------------------------------------------------
      // GO DIRECTLY TO ARRIVED
      // -----------------------------------------------------

      navigation.replace(
        "Arrived",
        {

          driver,

          rideData:
            finalRideData,

          finalFare,

          actualDistanceKm:
            serverActualDistanceKm,

          actualMinutes:
            serverActualMinutes,

        }
      );


    } catch (error) {

      console.log(
        "❌ COMPLETE TRIP ERROR:",
        error
      );


      completingTripRef.current =
        false;


      Alert.alert(
        "Trip Completion Error",
        "The trip could not be completed. Please try again."
      );

    }

  };


  // =======================================================
  // LISTEN TO DRIVER LOCATION
  // =======================================================

  useEffect(() => {

    let unsubscribe = null;
    let cancelled = false;


    // -----------------------------------------------------
    // NO MP ID
    // -----------------------------------------------------

    if (!mpId) {

      console.log("");
      console.log(
        "❌ DRIVER LOCATION LISTENER NOT STARTED"
      );

      console.log(
        "❌ NO MP ID AVAILABLE"
      );

      setLocationReceived(false);

      return () => {
        cancelled = true;
      };

    }


    // -----------------------------------------------------
    // START ASYNC FIREBASE SETUP
    // -----------------------------------------------------

    const startDriverLocationListener =
      async () => {

        try {

          console.log("");
          console.log("==================================================");
          console.log("📍 STARTING KANDOFAIDA DRIVER LOCATION LISTENER");
          console.log("==================================================");

          console.log(
            "MP ID:",
            mpId
          );

          console.log(
            "Ride Type:",
            effectiveRideType
          );


          // -------------------------------------------------
          // GET ACTUAL KANDOFAIDA DATABASE
          // -------------------------------------------------

          const faidaDb =
            await getFaidaDb();


          if (cancelled) {
            return;
          }


          console.log(
            "✅ KANDOFAIDA DATABASE READY"
          );


          // -------------------------------------------------
          // EXACT LOCATION PATH
          // -------------------------------------------------

          const locationPath =
            `KandoFaida/mobility_partners/${mpId}/location`;


          console.log(
            "Database:",
            "KandoFaida"
          );

          console.log(
            "Location Path:",
            locationPath
          );

          console.log("==================================================");


          // -------------------------------------------------
          // FIREBASE REFERENCE
          // -------------------------------------------------

          const locationRef =
            ref(
              faidaDb,
              locationPath
            );


          // -------------------------------------------------
          // LISTEN
          // -------------------------------------------------

          unsubscribe =
            onValue(

              locationRef,

              async snapshot => {

                console.log("");
                console.log(
                  "🟢 KANDOFAIDA LOCATION UPDATE"
                );

                console.log(
                  "Path:",
                  locationPath
                );

                console.log(
                  "Exists:",
                  snapshot.exists()
                );

                console.log(
                  "🔥 DRIVER LOCATION FIREBASE UPDATE:",
                  snapshot.val()
                );


                const rawLocation =
                  snapshot.val();


                console.log(
                  "Raw Location:",
                  rawLocation
                );


                // -------------------------------------------
                // NO LOCATION
                // -------------------------------------------

                if (!snapshot.exists()) {

                  console.log(
                    "⏳ DRIVER LOCATION NODE DOES NOT EXIST"
                  );

                  setLocationReceived(false);

                  return;

                }


                // -------------------------------------------
                // NULL LOCATION
                // -------------------------------------------

                if (!rawLocation) {

                  console.log(
                    "⏳ DRIVER LOCATION IS NULL"
                  );

                  setLocationReceived(false);

                  return;

                }


                // -------------------------------------------
                // READ LAT / LNG
                // -------------------------------------------

                const latitude =
                  Number(
                    rawLocation?.lat
                  );

                const longitude =
                  Number(
                    rawLocation?.lng
                  );


                console.log(
                  "Latitude:",
                  latitude
                );

                console.log(
                  "Longitude:",
                  longitude
                );


                // -------------------------------------------
                // VALIDATE
                // -------------------------------------------

                if (
                  !Number.isFinite(latitude) ||
                  !Number.isFinite(longitude)
                ) {

                  console.log(
                    "❌ INVALID DRIVER COORDINATES"
                  );

                  setLocationReceived(false);

                  return;

                }


                // -------------------------------------------
                // NEW DRIVER LOCATION
                // -------------------------------------------

                const newLocation = {
                  latitude,
                  longitude,
                };


                console.log("");
                console.log(
                  "✅ DRIVER LOCATION RECEIVED"
                );

                console.log(
                  "📍 Latitude:",
                  latitude
                );

                console.log(
                  "📍 Longitude:",
                  longitude
                );


                setDriverLocation(
                  newLocation
                );


                setLocationReceived(
                  true
                );


                // -------------------------------------------
                // DISTANCE TO PICKUP
                // -------------------------------------------

                const pickupDistance =
                  calculateDistanceMeters(
                    newLocation,
                    pickupLocation
                  );


                if (
                  pickupDistance !== null
                ) {

                  setDistanceToPickup(
                    pickupDistance
                  );


                  console.log(
                    "📏 DISTANCE TO PICKUP:",
                    pickupDistance,
                    "meters"
                  );


                  // -----------------------------------------
                  // DRIVER ARRIVED AT PICKUP
                  // -----------------------------------------

                  if (
                    pickupDistance <=
                    ARRIVAL_DISTANCE_METERS
                  ) {

                    if (
                      !driverArrivedRef.current
                    ) {

                      console.log("");
                      console.log(
                        "=================================================="
                      );

                      console.log(
                        "🎉 DRIVER HAS ARRIVED AT PICKUP"
                      );

                      console.log(
                        "Distance:",
                        pickupDistance,
                        "meters"
                      );

                      console.log(
                        "=================================================="
                      );


                      // ---------------------------------------
                      // LOCK PICKUP ARRIVAL
                      // ---------------------------------------

                      driverArrivedRef.current =
                        true;


                      setDriverArrived(
                        true
                      );


                      // ---------------------------------------
                      // RESET TRIP DISTANCE
                      // ---------------------------------------

                      actualDistanceKmRef.current =
                        0;


                      previousPointRef.current =
                        newLocation;


                      // ---------------------------------------
                      // START OFFICIAL SERVER TIMER
                      // ---------------------------------------

                      await startTripOnServer();

                    }

                  }

                }


                // =================================================
                // ACTUAL TRIP DISTANCE
                // =================================================

                if (
                  driverArrivedRef.current &&
                  tripStartedRef.current &&
                  !tripEndedRef.current
                ) {

                  if (
                    previousPointRef.current
                  ) {

                    const segment =
                      calculateDistanceMeters(
                        previousPointRef.current,
                        newLocation
                      );


                    // Ignore unrealistic GPS jumps
                    if (
                      segment !== null &&
                      segment < 100
                    ) {

                      actualDistanceKmRef.current +=
                        segment / 1000;


                      console.log(
                        "📏 TRIP DISTANCE:",
                        actualDistanceKmRef.current,
                        "km"
                      );

                    }

                  }


                  previousPointRef.current =
                    newLocation;

                }


                // =================================================
                // DESTINATION ARRIVAL
                // =================================================

                if (
                  driverArrivedRef.current &&
                  tripStartedRef.current &&
                  destination &&
                  !tripEndedRef.current
                ) {

                  const destinationDistance =
                    calculateDistanceMeters(
                      newLocation,
                      destination
                    );


                  if (
                    destinationDistance !== null
                  ) {

                    console.log(
                      "📍 DISTANCE TO DESTINATION:",
                      destinationDistance,
                      "meters"
                    );


                    // ---------------------------------------------
                    // WITHIN DESTINATION RADIUS
                    // ---------------------------------------------

                    if (
                      destinationDistance <=
                      DESTINATION_DISTANCE_METERS
                    ) {

                      destinationArrivalCountRef.current +=
                        1;


                      console.log(
                        "🏁 DESTINATION CONFIRMATION:",
                        destinationArrivalCountRef.current,
                        "/",
                        DESTINATION_CONFIRMATIONS
                      );


                    } else {

                      // Driver moved outside radius
                      destinationArrivalCountRef.current =
                        0;

                    }


                    // ---------------------------------------------
                    // DESTINATION CONFIRMED
                    // ---------------------------------------------

                    if (
                      destinationArrivalCountRef.current >=
                      DESTINATION_CONFIRMATIONS
                    ) {

                      console.log(
                        "🏁 DESTINATION ARRIVAL CONFIRMED"
                      );


                      await completeTripOnServer();

                    }

                  }

                }


                // -------------------------------------------
                // MOVE MAP TO DRIVER
                // -------------------------------------------

                if (mapRef.current) {

                  mapRef.current.animateToRegion(

                    {
                      latitude,
                      longitude,

                      latitudeDelta:
                        0.015,

                      longitudeDelta:
                        0.015,
                    },

                    800

                  );

                }

              },

              error => {

                console.log("");
                console.log(
                  "❌ KANDOFAIDA LOCATION LISTENER ERROR"
                );

                console.log(
                  error
                );

                setLocationReceived(false);

              }

            );

        } catch (error) {

          console.log("");
          console.log(
            "❌ FAILED TO GET KANDOFAIDA DATABASE"
          );

          console.log(
            error
          );

          setLocationReceived(false);

        }

      };


    startDriverLocationListener();


    // -------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------

    return () => {

      cancelled = true;

      console.log(
        "🧹 STOPPING DRIVER LOCATION LISTENER"
      );

      if (unsubscribe) {
        unsubscribe();
      }

    };

  }, [
    mpId,
    pickupLocation?.latitude,
    pickupLocation?.longitude,
  ]);


  // =======================================================
  // INITIAL MAP LOCATION
  // =======================================================

  const initialLatitude =
    pickupLocation?.latitude != null

      ? Number(
          pickupLocation.latitude
        )

      : -6.7924;


  const initialLongitude =
    pickupLocation?.longitude != null

      ? Number(
          pickupLocation.longitude
        )

      : 39.2083;


  // =======================================================
  // VALID PICKUP
  // =======================================================

  const validPickup =
    pickupLocation &&
    Number.isFinite(
      Number(
        pickupLocation.latitude
      )
    ) &&
    Number.isFinite(
      Number(
        pickupLocation.longitude
      )
    );


  // =======================================================
  // VALID DESTINATION
  // =======================================================

  const validDestination =
    destination &&
    Number.isFinite(
      Number(
        destination.latitude
      )
    ) &&
    Number.isFinite(
      Number(
        destination.longitude
      )
    );


  // =======================================================
  // VALID DRIVER LOCATION
  // =======================================================

  const validDriverLocation =
    driverLocation &&
    Number.isFinite(
      Number(
        driverLocation.latitude
      )
    ) &&
    Number.isFinite(
      Number(
        driverLocation.longitude
      )
    );


  // =======================================================
  // CALL DRIVER
  // =======================================================

  const callDriver = async () => {

    if (!driver?.phone) {

      Alert.alert(
        "Phone number unavailable"
      );

      return;

    }


    const phoneNumber =
      String(
        driver.phone
      ).trim();


    if (!phoneNumber) {

      Alert.alert(
        "Phone number unavailable"
      );

      return;

    }


    try {

      await Linking.openURL(
        `tel:${phoneNumber}`
      );

    } catch (error) {

      console.log(
        "❌ CALL DRIVER ERROR:",
        error
      );

      Alert.alert(
        "Unable to make call",
        "The phone app could not be opened."
      );

    }

  };


  // =======================================================
  // MAP
  // =======================================================

  return (

    <View
      style={styles.container}
    >

      <MapView

        ref={mapRef}

        style={styles.map}

        initialRegion={{
          latitude:
            initialLatitude,

          longitude:
            initialLongitude,

          latitudeDelta:
            0.05,

          longitudeDelta:
            0.05,
        }}

        showsUserLocation={false}

        showsMyLocationButton={false}

      >

        {/* =================================================
            DRIVER MARKER
        ================================================= */}

        {validDriverLocation && (

          <Marker
  key={`driver-${mpId}-${effectiveRideType}`}
  coordinate={{
    latitude: driverLocation.latitude,
    longitude: driverLocation.longitude,
  }}
  title={
    driver?.full_name ||
    driver?.name ||
    "Driver"
  }
  description={
    driverArrived
      ? "Driver has arrived"
      : "Driver is approaching"
  }
  anchor={{
    x: 0.5,
    y: 0.5,
  }}
  tracksViewChanges={true}
>
  <Image
    source={driverMarkerIcon}
    style={styles.driverMarkerImage}
    resizeMode="contain"
  />
</Marker>

        )}


        {/* =================================================
            PICKUP MARKER
        ================================================= */}

        {!driverArrived &&
          validPickup && (

            <Marker

              coordinate={{
                latitude:
                  Number(
                    pickupLocation.latitude
                  ),

                longitude:
                  Number(
                    pickupLocation.longitude
                  ),
              }}

              title="Pickup"

            >

              <View
                style={styles.pickupMarker}
              >

                <Text
                  style={styles.pickupMarkerText}
                >
                  P
                </Text>

              </View>

            </Marker>

          )}


        {/* =================================================
            DESTINATION MARKER
        ================================================= */}

        {driverArrived &&
          validDestination && (

            <Marker

              coordinate={{
                latitude:
                  Number(
                    destination.latitude
                  ),

                longitude:
                  Number(
                    destination.longitude
                  ),
              }}

              title="Destination"

            >

              <View
                style={styles.destinationMarker}
              >

                <Text
                  style={
                    styles.destinationMarkerText
                  }
                >
                  D
                </Text>

              </View>

            </Marker>

          )}


        {/* =================================================
            DRIVER → PICKUP
        ================================================= */}

        {!driverArrived &&
          validDriverLocation &&
          validPickup &&
          GOOGLE_MAPS_API_KEY && (

            <MapViewDirections

              origin={{
                latitude:
                  Number(
                    driverLocation.latitude
                  ),

                longitude:
                  Number(
                    driverLocation.longitude
                  ),
              }}

              destination={{
                latitude:
                  Number(
                    pickupLocation.latitude
                  ),

                longitude:
                  Number(
                    pickupLocation.longitude
                  ),
              }}

              apikey={
                GOOGLE_MAPS_API_KEY
              }

              strokeWidth={5}

              onReady={result => {

                console.log(
                  "🛣️ DRIVER → PICKUP ROUTE READY"
                );

                console.log(
                  "Distance:",
                  result.distance
                );

                console.log(
                  "Duration:",
                  result.duration
                );

              }}

              onError={error => {

                console.log(
                  "❌ DRIVER → PICKUP DIRECTIONS ERROR:",
                  error
                );

              }}

            />

          )}


        {/* =================================================
            DRIVER → DESTINATION
        ================================================= */}

        {driverArrived &&
          validDriverLocation &&
          validDestination &&
          GOOGLE_MAPS_API_KEY && (

            <MapViewDirections

              origin={{
                latitude:
                  Number(
                    driverLocation.latitude
                  ),

                longitude:
                  Number(
                    driverLocation.longitude
                  ),
              }}

              destination={{
                latitude:
                  Number(
                    destination.latitude
                  ),

                longitude:
                  Number(
                    destination.longitude
                  ),
              }}

              apikey={
                GOOGLE_MAPS_API_KEY
              }

              strokeWidth={5}

              onReady={result => {

                console.log(
                  "🛣️ DRIVER → DESTINATION ROUTE READY"
                );

                console.log(
                  "Remaining Distance:",
                  result.distance
                );

                console.log(
                  "Remaining Duration:",
                  result.duration
                );

              }}

              onError={error => {

                console.log(
                  "❌ DRIVER → DESTINATION DIRECTIONS ERROR:",
                  error
                );

              }}

            />

          )}

      </MapView>


      {/* ===================================================
          TOP STATUS
      =================================================== */}

      <View
        style={styles.topPanel}
      >

        <Text
          style={styles.title}
        >

          {driverArrived
            ? "Driver has arrived"
            : "Driver is approaching"}

        </Text>


        <Text
          style={styles.driverName}
        >

          {driver?.full_name ||
            driver?.name ||
            "Driver"}

        </Text>


        {effectiveRideType && (

          <Text
            style={styles.vehicle}
          >

            {effectiveRideType}

          </Text>

        )}


        {/* =================================================
            LOCATION STATUS
        ================================================= */}

        <View
          style={styles.locationStatus}
        >

          {locationReceived ? (

            <>

              <View
                style={styles.statusDot}
              />

              <Text
                style={styles.statusText}
              >

                {driverArrived
                  ? "Driver has arrived at pickup"
                  : "Driver location live"}

              </Text>

            </>

          ) : (

            <>

              <ActivityIndicator
                size="small"
              />

              <Text
                style={styles.statusText}
              >

                Waiting for driver location...

              </Text>

            </>

          )}

        </View>


        {/* =================================================
            DISTANCE
        ================================================= */}

        {!driverArrived &&
          distanceToPickup !== null && (

            <Text
              style={styles.coordinates}
            >

              {distanceToPickup < 1000

                ? `${Math.round(
                    distanceToPickup
                  )} m from pickup`

                : `${(
                    distanceToPickup /
                    1000
                  ).toFixed(2)} km from pickup`
              }

            </Text>

          )}


        {/* =================================================
            DRIVER COORDINATES
        ================================================= */}

        {validDriverLocation && (

          <Text
            style={styles.coordinates}
          >

            {driverLocation.latitude.toFixed(6)}

            {" , "}

            {driverLocation.longitude.toFixed(6)}

          </Text>

        )}

      </View>


      {/* ===================================================
          BOTTOM INFO
      =================================================== */}

      <View
        style={styles.bottomPanel}
      >

        <Text
          style={styles.approachingText}
        >

          {driverArrived
            ? "Your driver has arrived"
            : "Your driver is on the way"}

        </Text>


        {/* =================================================
            DRIVER PHONE
        ================================================= */}

        {driver?.phone && (

          <TouchableOpacity
            onPress={callDriver}
            activeOpacity={0.6}
          >

            <Text
              style={styles.phone}
            >

              {driver.phone}

            </Text>

          </TouchableOpacity>

        )}


        {/* =================================================
            FARE
        ================================================= */}

        {rideData?.fare != null && (

          <Text
            style={styles.fare}
          >

            Fare:{" "}

            {Number(
              rideData.fare
            ).toLocaleString()}

            {" TZS"}

          </Text>

        )}

      </View>

    </View>

  );

}


// ===========================================================
// STYLES
// ===========================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#fff",
    },


    map: {
      flex: 1,
    },


    // -------------------------------------------------------
    // DRIVER SATELLITE MARKER
    // -------------------------------------------------------

    driverMarkerImage: {
      width: 44,
      height: 44,
    },


    // -------------------------------------------------------
    // TOP PANEL
    // -------------------------------------------------------

    topPanel: {
      position: "absolute",

      top: 50,
      left: 15,
      right: 15,

      backgroundColor: "#fff",

      borderRadius: 15,

      paddingHorizontal: 18,
      paddingVertical: 14,

      elevation: 6,

      shadowOpacity: 0.15,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 2,
      },
    },


    title: {
      fontSize: 19,
      fontWeight: "700",
      textAlign: "center",
    },


    driverName: {
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 3,
    },


    vehicle: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
      marginTop: 2,
    },


    // -------------------------------------------------------
    // LOCATION STATUS
    // -------------------------------------------------------

    locationStatus: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      marginTop: 8,

      gap: 7,
    },


    statusDot: {
      width: 9,
      height: 9,

      borderRadius: 5,

      backgroundColor: "green",
    },


    statusText: {
      fontSize: 13,
      color: "#555",
    },


    coordinates: {
      fontSize: 11,
      color: "#777",

      textAlign: "center",

      marginTop: 4,
    },


    // -------------------------------------------------------
    // PICKUP MARKER
    // -------------------------------------------------------

    pickupMarker: {
      width: 34,
      height: 34,

      borderRadius: 17,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: "#000",
    },


    pickupMarkerText: {
      color: "#fff",

      fontSize: 16,

      fontWeight: "700",
    },


    // -------------------------------------------------------
    // DESTINATION MARKER
    // -------------------------------------------------------

    destinationMarker: {
      width: 34,
      height: 34,

      borderRadius: 17,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: "#555",
    },


    destinationMarkerText: {
      color: "#fff",

      fontSize: 16,

      fontWeight: "700",
    },


    // -------------------------------------------------------
    // BOTTOM PANEL
    // -------------------------------------------------------

    bottomPanel: {
      position: "absolute",

      bottom: 0,
      left: 0,
      right: 0,

      backgroundColor: "#fff",

      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,

      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 30,

      elevation: 10,

      shadowOpacity: 0.15,
      shadowRadius: 10,

      shadowOffset: {
        width: 0,
        height: -3,
      },

      alignItems: "center",
    },


    approachingText: {
      fontSize: 18,
      fontWeight: "700",
    },


    phone: {
      fontSize: 14,

      color: "#666",

      marginTop: 4,

      textDecorationLine: "underline",
    },


    fare: {
      fontSize: 15,

      fontWeight: "600",

      marginTop: 8,
    },

  });