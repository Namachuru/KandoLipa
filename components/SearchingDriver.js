import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  TouchableOpacity,
} from "react-native";

import {
  lipaFunctions,
  lipaDb,
  faidaDb,
} from "../firebase/firebase";

import {
  ref,
  onValue,
  set,
} from "@react-native-firebase/database";

import MapView, {
  Marker,
} from "react-native-maps";

import MapViewDirections from
  "react-native-maps-directions";

import * as Location from "expo-location";

import Constants from "expo-constants";


// ==========================================================
// GOOGLE MAPS API KEY
// ==========================================================

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;


// ==========================================================
// SEARCHING DRIVER
// ==========================================================

const SearchingDriver = ({
  route,
  navigation,
}) => {

  const {
    pickupLocation,
    destination,
    selectedRide,
    rideData,
  } = route.params || {};


  // ========================================================
  // WINNING DRIVER
  // ========================================================

  const driver =
    rideData?.winner ?? null;


  // ========================================================
  // ANIMATION
  // ========================================================

  const pulse = useRef(
    new Animated.Value(1),
  ).current;


  // ========================================================
  // LOCATION SUBSCRIPTION
  // ========================================================

  const locationSubscription =
    useRef(null);


  // ========================================================
  // REQUEST LOCK
  //
  // Hard protection against rapid duplicate presses.
  // This is a ref because it changes synchronously.
  // ========================================================

  const requestLock =
    useRef(false);


  // ========================================================
  // STATE
  // ========================================================

  const [requestId, setRequestId] =
    useState(
      rideData?.request_id ||
      rideData?.requestId ||
      null,
    );

  const [requestStatus, setRequestStatus] =
    useState(null);

  const [requestSent, setRequestSent] =
    useState(false);


  // ========================================================
  // CONFIRM BUTTON STATE
  //
  // IMPORTANT:
  //
  // This state controls the VISUAL button immediately.
  //
  // requestLock.current protects against duplicate presses.
  // isConfirming causes React to immediately re-render the
  // button and make it gray/disabled.
  // ========================================================

  const [isConfirming, setIsConfirming] =
    useState(false);


  // ========================================================
  // AUTHENTICATION
  // ========================================================

  const auth =
    require("@react-native-firebase/auth")
      .getAuth();


  // ========================================================
  // DEBUG
  // ========================================================

  useEffect(() => {

    console.log("");
    console.log(
      "==================================================",
    );

    console.log(
      "🔵 SEARCHING DRIVER SCREEN",
    );

    console.log(
      "==================================================",
    );

    console.log(
      "📍 Pickup:",
      pickupLocation,
    );

    console.log(
      "🏁 Destination:",
      destination,
    );

    console.log(
      "🚗 Selected Ride:",
      selectedRide,
    );

    console.log(
      "📦 Ride Data:",
      rideData,
    );

    console.log(
      "🏆 Winner:",
      driver,
    );

    console.log(
      "🚗 Driver MP ID:",
      driver?.mp_id,
    );

    console.log(
      "🆔 Request ID:",
      requestId,
    );

    console.log(
      "👤 Client ID:",
      auth.currentUser?.uid,
    );

    console.log(
      "==================================================",
    );

  }, []);


  // ========================================================
  // UPDATE REQUEST ID IF RIDE DATA CHANGES
  // ========================================================

  useEffect(() => {

    const incomingRequestId =
      rideData?.request_id ||
      rideData?.requestId ||
      null;


    if (
      incomingRequestId &&
      incomingRequestId !== requestId
    ) {

      console.log(
        "🆔 REQUEST ID UPDATED:",
        incomingRequestId,
      );

      setRequestId(
        incomingRequestId,
      );

    }

  }, [
    rideData?.request_id,
    rideData?.requestId,
  ]);


  // ========================================================
  // VEHICLE ICON
  // ========================================================

  const getVehicleIcon = () => {

    if (
      selectedRide === "Mchoro"
    ) {
      return "🏍️";
    }

    if (
      selectedRide === "Roka"
    ) {
      return "🛺";
    }

    if (
      selectedRide === "Wea"
    ) {
      return "🚗";
    }

    if (
      selectedRide === "Zoa"
    ) {
      return "🚐";
    }

    return "🚕";
  };


  // ========================================================
  // BIG / SMALL VEHICLE ANIMATION
  // ========================================================

  useEffect(() => {

    const animation =
      Animated.loop(

        Animated.sequence([

          Animated.timing(
            pulse,
            {
              toValue: 1.25,

              duration: 700,

              useNativeDriver: true,
            },
          ),

          Animated.timing(
            pulse,
            {
              toValue: 1,

              duration: 700,

              useNativeDriver: true,
            },
          ),

        ]),

      );


    animation.start();


    return () => {

      animation.stop();

    };

  }, [pulse]);


  // ========================================================
  // SEND RIDE REQUEST
  //
  // ONLY RUNS WHEN USER PRESSES
  // "CONFIRM REQUEST"
  // ========================================================

  const sendRequestToDriver =
    async () => {

      // ====================================================
      // INSTANT VISUAL LOCK
      //
      // IMPORTANT:
      //
      // This is the FIRST operation when the user taps.
      // It causes the button to immediately become gray.
      // ====================================================

      if (
        requestLock.current ||
        isConfirming ||
        requestSent
      ) {

        console.log(
          "⚠️ CONFIRM REQUEST ALREADY LOCKED",
        );

        return;
      }


      // ====================================================
      // SYNCHRONOUS HARD LOCK
      //
      // This happens immediately before ANY await.
      // ====================================================

      requestLock.current =
        true;


      // ====================================================
      // IMMEDIATE UI LOCK
      //
      // React will re-render the button as disabled.
      // ====================================================

      setIsConfirming(
        true,
      );


      // ====================================================
      // DRIVER VALIDATION
      // ====================================================

      if (
        !driver?.mp_id
      ) {

        console.log(
          "❌ No driver ID",
        );


        requestLock.current =
          false;


        setIsConfirming(
          false,
        );


        Alert.alert(
          "Driver Error",
          "No driver was found.",
        );


        return;
      }


      try {

        console.log("");
        console.log(
          "==================================================",
        );

        console.log(
          "🔥 REQUESTING RIDE FROM SERVER",
        );

        console.log(
          "==================================================",
        );

        console.log(
          "🚗 DRIVER:",
          driver.mp_id,
        );


        // ==================================================
        // LOCATION PERMISSION
        // ==================================================

        const {
          status,
        } =
          await Location
            .requestForegroundPermissionsAsync();


        if (
          status !== "granted"
        ) {

          // Unlock because the request did not happen.

          requestLock.current =
            false;


          setIsConfirming(
            false,
          );


          Alert.alert(
            "Location Required",
            "Please allow location access to request a ride.",
          );


          return;
        }


        // ==================================================
        // CURRENT CLIENT GPS
        // ==================================================

        const currentLocation =
          await Location
            .getCurrentPositionAsync({

              accuracy:
                Location.Accuracy.High,

            });


        const clientLocation = {

          lat:
            currentLocation
              .coords
              .latitude,

          lng:
            currentLocation
              .coords
              .longitude,

        };


        console.log(
          "📱 CURRENT CLIENT GPS:",
          clientLocation,
        );


        // ==================================================
        // CALL SERVER requestRide
        // ==================================================

        const requestRide =
          lipaFunctions
            .httpsCallable(
              "requestRide",
            );


        const result =
          await requestRide({

            // Passenger selected pickup
            userLocation:
              pickupLocation,

            // Actual passenger GPS
            clientLocation:
              clientLocation,

            // Destination
            destination:
              destination,

            // Selected vehicle
            selectedRide:
              selectedRide,

            // Winner information
            rideData:
              rideData,

          });


        console.log(
          "🔥 REQUEST RIDE RESPONSE:",
          result.data,
        );


        // ==================================================
        // GET REQUEST ID
        // ==================================================

        const newRequestId =
          result.data?.request_id ||
          result.data?.requestId ||
          null;


        if (
          !newRequestId
        ) {

          throw new Error(
            "Server did not return a request ID.",
          );

        }


        console.log(
          "🔥 REQUEST ID:",
          newRequestId,
        );


        // ==================================================
        // UPDATE LOCAL STATE
        // ==================================================

        setRequestId(
          newRequestId,
        );


        setRequestSent(
          true,
        );


        setRequestStatus(
          "pending",
        );


        // ==================================================
        // KEEP BUTTON LOCKED
        //
        // IMPORTANT:
        //
        // We DO NOT reset requestLock here.
        //
        // The request was successfully created, therefore
        // the user must not be allowed to send it again.
        // ==================================================

        setIsConfirming(
          false,
        );


        console.log(
          "✅ RIDE REQUEST SUCCESSFULLY SENT",
        );

        console.log(
          "🆔 ACTIVE REQUEST:",
          newRequestId,
        );


        Alert.alert(
          "Ride Requested",
          "Your request has been sent to the driver.",
        );


      } catch (
        error
      ) {

        console.log(
          "❌ REQUEST RIDE ERROR:",
          error,
        );


        // ==================================================
        // UNLOCK ONLY WHEN REQUEST FAILED
        // ==================================================

        requestLock.current =
          false;


        setIsConfirming(
          false,
        );


        Alert.alert(
          "Request Failed",
          error?.message ||
            "Unable to request the driver.",
        );

      }

    };


  // ========================================================
  // LIVE CLIENT GPS
  //
  // KandoFaida:
  //
  // KandoFaida/
  //   mobility_partners/
  //     driverId/
  //       ride_requests/
  //         requestId/
  //           client_location
  // ========================================================

  useEffect(() => {

    if (
      !requestId ||
      !driver?.mp_id
    ) {

      return;
    }


    let cancelled =
      false;


    const startClientTracking =
      async () => {

        try {

          console.log(
            "📡 STARTING LIVE CLIENT GPS",
          );

          console.log(
            "🆔 REQUEST:",
            requestId,
          );

          console.log(
            "🚗 DRIVER:",
            driver.mp_id,
          );


          // ==================================================
          // CHECK PERMISSION
          // ==================================================

          const {
            status,
          } =
            await Location
              .getForegroundPermissionsAsync();


          if (
            status !== "granted"
          ) {

            console.log(
              "❌ Client location permission not granted",
            );

            return;
          }


          if (
            cancelled
          ) {

            return;
          }


          // ==================================================
          // FIREBASE LOCATION REF
          // ==================================================

          const clientLocationRef =
            ref(
              faidaDb,

              `KandoFaida/mobility_partners/${driver.mp_id}` +
              `/ride_requests/${requestId}` +
              `/client_location`,
            );


          console.log(
            "📡 CLIENT GPS FIREBASE PATH:",

            `KandoFaida/mobility_partners/${driver.mp_id}` +
            `/ride_requests/${requestId}` +
            `/client_location`,
          );


          // ==================================================
          // INITIAL GPS
          // ==================================================

          const initialLocation =
            await Location
              .getCurrentPositionAsync({

                accuracy:
                  Location.Accuracy.High,

              });


          if (
            cancelled
          ) {

            return;
          }


          const initialClientLocation = {

            lat:
              initialLocation
                .coords
                .latitude,

            lng:
              initialLocation
                .coords
                .longitude,

          };


          console.log(
            "📱 INITIAL CLIENT GPS:",
            initialClientLocation,
          );


          await set(
            clientLocationRef,
            initialClientLocation,
          );


          console.log(
            "✅ INITIAL CLIENT GPS SAVED",
          );


          // ==================================================
          // WATCH CLIENT GPS
          // ==================================================

          locationSubscription.current =
            await Location
              .watchPositionAsync(

                {

                  accuracy:
                    Location.Accuracy.High,

                  distanceInterval:
                    5,

                  timeInterval:
                    3000,

                },

                async (
                  location,
                ) => {

                  if (
                    cancelled
                  ) {

                    return;
                  }


                  const clientLocation = {

                    lat:
                      location
                        .coords
                        .latitude,

                    lng:
                      location
                        .coords
                        .longitude,

                  };


                  console.log(
                    "📱 LIVE CLIENT GPS:",
                    clientLocation,
                  );


                  try {

                    await set(
                      clientLocationRef,
                      clientLocation,
                    );


                    console.log(
                      "✅ CLIENT GPS UPDATED",
                    );

                  } catch (
                    error
                  ) {

                    console.error(
                      "❌ FAILED TO UPDATE CLIENT GPS:",
                      error,
                    );

                  }

                },

              );


          console.log(
            "✅ CLIENT GPS TRACKING STARTED",
          );


        } catch (
          error
        ) {

          console.error(
            "❌ CLIENT GPS TRACKING ERROR:",
            error,
          );

        }

      };


    startClientTracking();


    // ======================================================
    // CLEANUP
    // ======================================================

    return () => {

      cancelled =
        true;


      if (
        locationSubscription.current
      ) {

        console.log(
          "🧹 STOPPING CLIENT GPS TRACKING",
        );


        locationSubscription
          .current
          .remove();


        locationSubscription.current =
          null;

      }

    };


  }, [
    requestId,
    driver?.mp_id,
  ]);


  // ========================================================
  // LISTEN FOR DRIVER RESPONSE
  //
  // KandoLipa/
  //   clients/
  //     CLIENT_UID/
  //       ride_requests/
  //         REQUEST_ID/
  //           status
  // ========================================================

  useEffect(() => {

    const clientId =
      auth.currentUser?.uid;


    if (
      !clientId
    ) {

      console.log(
        "❌ DRIVER RESPONSE LISTENER: NO CLIENT UID",
      );

      return;
    }


    if (
      !requestId
    ) {

      console.log(
        "⚠️ DRIVER RESPONSE LISTENER: NO REQUEST ID",
      );

      return;
    }


    if (
      !driver?.mp_id
    ) {

      console.log(
        "⚠️ DRIVER RESPONSE LISTENER: NO DRIVER ID",
      );

      return;
    }


    const requestPath =
      `KandoLipa/clients/${clientId}` +
      `/ride_requests/${requestId}`;


    console.log("");
    console.log(
      "==================================================",
    );

    console.log(
      "👂 STARTING DRIVER REQUEST LISTENER",
    );

    console.log(
      "==================================================",
    );

    console.log(
      "👤 CLIENT ID:",
      clientId,
    );

    console.log(
      "🚗 DRIVER ID:",
      driver.mp_id,
    );

    console.log(
      "🆔 REQUEST ID:",
      requestId,
    );

    console.log(
      "📡 LISTENER PATH:",
      requestPath,
    );

    console.log(
      "==================================================",
    );


    const requestRef =
      ref(
        lipaDb,
        requestPath,
      );


    const handleRequestChange =
      (snapshot) => {

        const request =
          snapshot.val();


        console.log("");
        console.log(
          "🔥🔥🔥 KANDOLIPA REQUEST UPDATE",
        );

        console.log(
          "📡 PATH:",
          requestPath,
        );

        console.log(
          "📦 EXISTS:",
          snapshot.exists(),
        );

        console.log(
          "📦 REQUEST:",
          request,
        );


        if (
          !request
        ) {

          console.log(
            "⚠️ REQUEST DOES NOT EXIST",
          );

          return;
        }


        const status =
          request.status ||
          null;


        console.log(
          "🚦 RIDE REQUEST STATUS:",
          status,
        );


        setRequestStatus(
          status,
        );


        if (
          status === "pending"
        ) {

          console.log(
            "⏳ DRIVER REQUEST IS PENDING",
          );

          return;
        }


        if (
          status === "accepted"
        ) {

          console.log("");
          console.log(
            "==============================================",
          );

          console.log(
            "✅✅✅ DRIVER ACCEPTED RIDE",
          );

          console.log(
            "🚀 NAVIGATING TO DriverApproachingScreen",
          );

          console.log(
            "==============================================",
          );


          navigation.replace(
            "DriverApproaching",
            {

              pickupLocation,

              destination,

              selectedRide,

              rideData,

              driver,

              requestId

            }
          );


          return;
        }


        if (
          status === "rejected"
        ) {

          console.log(
            "❌ DRIVER REJECTED RIDE",
          );


          setRequestSent(
            false,
          );

          setRequestStatus(
            "rejected",
          );

          setRequestId(
            null,
          );


          requestLock.current =
            false;


          setIsConfirming(
            false,
          );


          Alert.alert(
            "Ride Declined",
            "The driver declined your request.",
            [
              {
                text: "OK",

                onPress: () => {

                  navigation.replace(
                    "Taxi",
                  );

                },

              },
            ],
          );


          return;
        }

      };


    const unsubscribeRequestListener = onValue(
      requestRef,
      handleRequestChange,
    );


    return () => {

      console.log(
        "🧹 REMOVING DRIVER REQUEST LISTENER",
      );


      unsubscribeRequestListener();

    };


  }, [

    requestId,

    driver?.mp_id,

    navigation,

    pickupLocation,

    destination,

    selectedRide,

    rideData,

  ]);


  // ========================================================
  // NO DRIVER TIMEOUT
  // ========================================================

  useEffect(() => {

    if (
      requestSent
    ) {

      return;
    }


    if (
      rideData?.winner
    ) {

      return;
    }


    const timeout =
      setTimeout(() => {

        console.log(
          "⏰ DRIVER SEARCH TIMEOUT",
        );


        Alert.alert(
          "No Driver Found",
          "No driver was found.",
        );


        navigation.navigate(
          "Taxi",
        );

      }, 20000);


    return () =>
      clearTimeout(
        timeout,
      );


  }, [

    rideData,

    navigation,

    requestSent,

  ]);


  // ========================================================
  // VALIDATION
  // ========================================================

  if (
    !pickupLocation ||
    !destination
  ) {

    return (

      <View
        style={styles.center}
      >

        <Text>
          Missing trip data...
        </Text>

      </View>

    );

  }


  // ========================================================
  // MAIN UI
  // ========================================================

  return (

    <View
      style={styles.container}
    >

      {/* ==================================================
          MAP
      ================================================== */}

      <MapView
        style={styles.map}

        initialRegion={{

          latitude:
            Number(
              pickupLocation.latitude,
            ),

          longitude:
            Number(
              pickupLocation.longitude,
            ),

          latitudeDelta:
            0.05,

          longitudeDelta:
            0.05,

        }}
      >

        {/* ==================================================
            PICKUP
        ================================================== */}

        <Marker
          coordinate={{

            latitude:
              Number(
                pickupLocation.latitude,
              ),

            longitude:
              Number(
                pickupLocation.longitude,
              ),

          }}

          title="Pickup"
        />


        {/* ==================================================
            DESTINATION
        ================================================== */}

        <Marker
          coordinate={{

            latitude:
              Number(
                destination.latitude,
              ),

            longitude:
              Number(
                destination.longitude,
              ),

          }}

          title="Destination"

          pinColor="green"
        />


        {/* ==================================================
            ROUTE
        ================================================== */}

        <MapViewDirections

          origin={{

            latitude:
              Number(
                pickupLocation.latitude,
              ),

            longitude:
              Number(
                pickupLocation.longitude,
              ),

          }}

          destination={{

            latitude:
              Number(
                destination.latitude,
              ),

            longitude:
              Number(
                destination.longitude,
              ),

          }}

          apikey={
            GOOGLE_MAPS_API_KEY
          }

          strokeWidth={4}

          strokeColor="black"

        />


        {/* ==================================================
            DRIVER
        ================================================== */}

        {driver?.location && (

          <Marker

            coordinate={{

              latitude:
                Number(
                  driver.location.lat,
                ),

              longitude:
                Number(
                  driver.location.lng,
                ),

            }}

            title="Driver"

          />

        )}

      </MapView>


      {/* ==================================================
          BOTTOM CARD
      ================================================== */}

      <View
        style={styles.card}
      >

        {/* ==================================================
            ANIMATED VEHICLE ICON
        ================================================== */}

        <Animated.View
          style={[
            styles.vehicleCircle,

            {
              transform: [
                {
                  scale: pulse,
                },
              ],
            },

          ]}
        >

          <Text
            style={
              styles.vehicleIcon
            }
          >
            {getVehicleIcon()}
          </Text>

        </Animated.View>


        {/* ==================================================
            TITLE
        ================================================== */}

        <Text
          style={styles.title}
        >

          {requestStatus ===
          "accepted"

            ? "Driver Accepted"

            : requestSent

              ? "Waiting for Driver"

              : `Finding ${selectedRide} Driver`

          }

        </Text>


        {/* ==================================================
            DRIVER
        ================================================== */}

        {driver ? (

          <>

            <Text
              style={
                styles.driverName
              }
            >

              🚗{" "}
              {driver.full_name ||
                driver.name ||
                "Driver"}

            </Text>


            {/* ==================================================
                DISTANCE
            ================================================== */}

            <Text
              style={styles.info}
            >

              📍 Distance:{" "}

              {driver.distance != null

                ? Number(
                    driver.distance,
                  ).toFixed(2)

                : "--"}

              {" "}km

            </Text>


            {/* ==================================================
                FARE
            ================================================== */}

            <Text
              style={styles.info}
            >

              💰 Fare: TSh{" "}

              {rideData?.fare != null

                ? Number(
                    rideData.fare,
                  ).toLocaleString()

                : "--"}

            </Text>


            {/* ==================================================
                ETA
            ================================================== */}

            <Text
              style={styles.info}
            >

              ⏱ ETA:{" "}

              {rideData?.pickupEta ??
                "--"}

              {" "}min

            </Text>


            {/* ==================================================
                REQUEST STATUS
            ================================================== */}

            {requestSent && (

              <View
                style={
                  styles.statusBox
                }
              >

                <Text
                  style={
                    styles.statusText
                  }
                >

                  {requestStatus ===
                  "pending"

                    ? "⏳ Waiting for driver..."

                    : requestStatus ===
                      "accepted"

                      ? "✅ Driver accepted!"

                      : requestStatus}

                </Text>

              </View>

            )}


            {/* ==================================================
                CONFIRM REQUEST
            ================================================== */}

            {!requestSent && (

              <TouchableOpacity

                disabled={
                  isConfirming
                }

                activeOpacity={
                  isConfirming
                    ? 1
                    : 0.7
                }

                style={[

                  styles.confirmButton,

                  isConfirming &&
                    styles.confirmButtonDisabled,

                ]}

                onPress={
                  sendRequestToDriver
                }

              >

                <Text
                  style={
                    styles.confirmText
                  }
                >

                  {isConfirming
                    ? "Requesting..."
                    : "Confirm Request"}

                </Text>

              </TouchableOpacity>

            )}

          </>

        ) : (

          // ====================================================
          // STILL SEARCHING FOR DRIVER
          // ====================================================

          <View
            style={
              styles.loadingBox
            }
          >

            <Animated.View
              style={[
                styles.vehicleSearchCircle,

                {
                  transform: [
                    {
                      scale: pulse,
                    },
                  ],
                },

              ]}
            >

              <Text
                style={
                  styles.searchVehicleIcon
                }
              >
                {getVehicleIcon()}
              </Text>

            </Animated.View>


            <Text
              style={
                styles.loadingText
              }
            >

              Searching for best{" "}
              {selectedRide || "vehicle"}{" "}
              driver...

            </Text>

          </View>

        )}

      </View>

    </View>

  );

};


// ==========================================================
// STYLES
// ==========================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
    },


    map: {
      flex: 1,
    },


    center: {

      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

    },


    // ======================================================
    // CARD
    // ======================================================

    card: {

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
        20,

      padding:
        20,

      elevation:
        5,

    },


    // ======================================================
    // ANIMATED VEHICLE
    // ======================================================

    vehicleCircle: {

      width:
        80,

      height:
        80,

      borderRadius:
        40,

      backgroundColor:
        "#f1f1f1",

      alignSelf:
        "center",

      justifyContent:
        "center",

      alignItems:
        "center",

      marginBottom:
        10,

    },


    vehicleIcon: {

      fontSize:
        42,

      textAlign:
        "center",

    },


    // ======================================================
    // TITLE
    // ======================================================

    title: {

      fontSize:
        18,

      fontWeight:
        "bold",

      marginBottom:
        10,

      textAlign:
        "center",

    },


    // ======================================================
    // DRIVER
    // ======================================================

    driverName: {

      fontSize:
        22,

      fontWeight:
        "bold",

      marginBottom:
        8,

      textAlign:
        "center",

    },


    // ======================================================
    // INFORMATION
    // ======================================================

    info: {

      fontSize:
        16,

      marginBottom:
        4,

    },


    // ======================================================
    // SEARCHING
    // ======================================================

    loadingBox: {

      alignItems:
        "center",

      paddingVertical:
        20,

    },


    vehicleSearchCircle: {

      width:
        90,

      height:
        90,

      borderRadius:
        45,

      backgroundColor:
        "#f1f1f1",

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom:
        12,

    },


    searchVehicleIcon: {

      fontSize:
        50,

      textAlign:
        "center",

    },


    loadingText: {

      opacity:
        0.6,

      fontSize:
        15,

    },


    // ======================================================
    // STATUS
    // ======================================================

    statusBox: {

      marginTop:
        15,

      padding:
        12,

      borderRadius:
        10,

      backgroundColor:
        "#f1f5f9",

      alignItems:
        "center",

    },


    statusText: {

      fontSize:
        15,

      fontWeight:
        "600",

    },


    // ======================================================
    // CONFIRM BUTTON
    // ======================================================

    confirmButton: {

      marginTop:
        15,

      backgroundColor:
        "#22c55e",

      padding:
        15,

      borderRadius:
        12,

      alignItems:
        "center",

    },


    // ======================================================
    // DISABLED / REQUESTING BUTTON
    // ======================================================

    confirmButtonDisabled: {

      backgroundColor:
        "#9ca3af",

    },


    confirmText: {

      color:
        "white",

      fontWeight:
        "bold",

      fontSize:
        16,

    },

  });


export default SearchingDriver;