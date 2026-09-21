import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";

import MapView, {
  Marker,
} from "react-native-maps";

import MapViewDirections from "react-native-maps-directions";

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

import Constants from "expo-constants";

import {
  ref,
  onValue,
} from "firebase/database";

import {
  faidaDb,
} from "../firebase/firebase";

import {
  useNavigation,
} from "@react-navigation/native";


const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.extra?.GOOGLE_MAPS_APIKEY;


/* ============================================================
   DISTANCE HELPER
============================================================ */

const getDistanceMeters = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371000;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};


/* ============================================================
   TRIP SCREEN
============================================================ */

const TripScreen = ({ route }) => {
  const {
    driver,
    destination,
    rideData,
    requestId,
    clientId,
  } = route.params;

  const navigation = useNavigation();

  const functions = getFunctions();

  const completeTrip = httpsCallable(
    functions,
    "completeTrip"
  );

  const mapRef = useRef(null);

  const tripStartTimeRef = useRef(Date.now());

  const previousPointRef = useRef(null);

  const arrivalCountRef = useRef(0);

  const finishingTripRef = useRef(false);

  const [driverLocation, setDriverLocation] =
    useState(null);

  const [distanceLeft, setDistanceLeft] =
    useState(null);

  const [eta, setEta] =
    useState(null);

  const [tripEnded, setTripEnded] =
    useState(false);

  const [actualDistanceKm, setActualDistanceKm] =
    useState(0);


  /* ============================================================
     DEBUG
  ============================================================ */

  useEffect(() => {
    console.log("====================================");
    console.log("🚕 TRIP SCREEN STARTED");
    console.log("DRIVER:", driver);
    console.log("DRIVER MP ID:", driver?.mp_id);
    console.log("DESTINATION:", destination);
    console.log("RIDE DATA:", rideData);
    console.log("REQUEST ID:", requestId);
    console.log("CLIENT ID:", clientId);

    console.log(
      "GOOGLE MAPS API KEY:",
      GOOGLE_MAPS_API_KEY ? "YES" : "NO"
    );

    console.log("====================================");
  }, []);


  /* ============================================================
     VEHICLE IMAGE
  ============================================================ */

  const vehicleImage =
    rideData?.type === "Roka"
      ? require("../assets/weari/roka_satelite.png")
      : rideData?.type === "Wea"
      ? require("../assets/weari/wea_satelite.png")
      : rideData?.type === "Mchoro"
      ? require("../assets/weari/mchoro_satelite.png")
      : rideData?.type === "Zoa"
      ? require("../assets/weari/zoa_satelite.png")
      : require("../assets/weari/mchoro_satelite.png");


  /* ============================================================
     LIVE DRIVER LOCATION
  ============================================================ */

  useEffect(() => {
    if (!driver?.mp_id) {
      console.log("❌ NO DRIVER MP ID");
      return;
    }

    const locationRef = ref(
      faidaDb,
      `KandoFaida/mobility_partners/${driver.mp_id}/location`
    );

    console.log(
      "📡 LISTENING TO:",
      `KandoFaida/mobility_partners/${driver.mp_id}/location`
    );

    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.log(
            "❌ DRIVER LOCATION DOES NOT EXIST"
          );
          return;
        }

        const loc = snapshot.val();

        console.log(
          "📍 DRIVER LOCATION:",
          loc
        );

        if (
          loc?.lat === undefined ||
          loc?.lng === undefined
        ) {
          console.log(
            "❌ INVALID DRIVER LOCATION"
          );
          return;
        }

        if (
          loc?.accuracy &&
          loc.accuracy > 30
        ) {
          console.log(
            "⚠️ GPS ACCURACY:",
            loc.accuracy,
            "meters"
          );
          return;
        }

        const newPoint = {
          latitude: Number(loc.lat),
          longitude: Number(loc.lng),
        };


        /* ======================================================
           DISTANCE TRAVELLED
        ====================================================== */

        if (previousPointRef.current) {
          const segment =
            getDistanceMeters(
              previousPointRef.current.latitude,
              previousPointRef.current.longitude,
              newPoint.latitude,
              newPoint.longitude
            );

          console.log(
            "📏 GPS SEGMENT:",
            segment.toFixed(2),
            "meters"
          );

          if (segment < 100) {
            setActualDistanceKm(
              (old) =>
                old + segment / 1000
            );
          }
        }

        previousPointRef.current =
          newPoint;


        /* ======================================================
           GPS SMOOTHING
        ====================================================== */

        setDriverLocation((previous) => {
          if (!previous) {
            return newPoint;
          }

          return {
            latitude:
              previous.latitude * 0.7 +
              newPoint.latitude * 0.3,

            longitude:
              previous.longitude * 0.7 +
              newPoint.longitude * 0.3,
          };
        });
      }
    );

    return () => {
      unsubscribe();

      console.log(
        "🛑 DRIVER LOCATION LISTENER STOPPED"
      );
    };
  }, [driver?.mp_id]);


  /* ============================================================
     MAP AUTO FIT
  ============================================================ */

  useEffect(() => {
    if (
      !driverLocation ||
      !destination
    ) {
      return;
    }

    mapRef.current?.fitToCoordinates(
      [
        driverLocation,
        destination,
      ],
      {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 200,
          left: 50,
        },
        animated: true,
      }
    );
  }, [
    driverLocation,
    destination,
  ]);


  /* ============================================================
     FINISH TRIP
  ============================================================ */

  const finishTrip = async () => {
    if (
      tripEnded ||
      finishingTripRef.current
    ) {
      console.log(
        "⚠️ FINISH TRIP ALREADY RUNNING"
      );
      return;
    }

    finishingTripRef.current = true;

    setTripEnded(true);

    const actualMinutes =
      (
        Date.now() -
        tripStartTimeRef.current
      ) / 60000;

    console.log("====================================");
    console.log("🚕 FINISHING TRIP");
    console.log(
      "DRIVER MP ID:",
      driver?.mp_id
    );
    console.log(
      "RIDE TYPE:",
      rideData?.type
    );
    console.log(
      "DISTANCE:",
      actualDistanceKm,
      "km"
    );
    console.log(
      "MINUTES:",
      actualMinutes
    );
    console.log(
      "REQUEST ID:",
      requestId
    );
    console.log(
      "CLIENT ID:",
      clientId
    );
    console.log("====================================");

    try {
      console.log(
        "📡 CALLING completeTrip..."
      );

      const result =
        await completeTrip({
          driverId: driver.mp_id,
          rideType: rideData.type,
          actualDistanceKm,
          actualMinutes,
        });

      console.log("====================================");
      console.log(
        "✅ completeTrip SUCCESS"
      );
      console.log(
        "FUNCTION RESULT:",
        result.data
      );
      console.log(
        "FINAL FARE:",
        result.data?.finalFare
      );
      console.log("====================================");

      console.log(
        "➡️ NAVIGATING TO ARRIVED..."
      );

      navigation.replace(
        "Arrived",
        {
          driver,
          rideData,

          finalFare:
            result.data?.finalFare || 0,

          actualDistanceKm,

          actualMinutes,

          requestId:
            requestId || null,

          clientId:
            clientId || null,
        }
      );

    } catch (error) {
      console.log("====================================");
      console.log(
        "❌ COMPLETE TRIP FAILED"
      );
      console.log(
        "ERROR:",
        error
      );
      console.log(
        "ERROR CODE:",
        error?.code
      );
      console.log(
        "ERROR MESSAGE:",
        error?.message
      );
      console.log(
        "ERROR DETAILS:",
        error?.details
      );
      console.log("====================================");

      setTripEnded(false);

      finishingTripRef.current = false;
    }
  };


  /* ============================================================
     ARRIVAL DETECTION
  ============================================================ */

  useEffect(() => {
    if (
      !driverLocation ||
      !destination ||
      tripEnded
    ) {
      return;
    }

    const distance =
      getDistanceMeters(
        driverLocation.latitude,
        driverLocation.longitude,
        destination.latitude,
        destination.longitude
      );

    console.log(
      "📍 DISTANCE TO DESTINATION:",
      distance.toFixed(1),
      "meters"
    );

    if (distance <= 60) {
  arrivalCountRef.current += 1;
} else {
  arrivalCountRef.current = 0;
}

console.log(
  "🏁 DESTINATION CONFIRMATION:",
  arrivalCountRef.current,
  "/ 1"
);

console.log(
  "📍 DISTANCE TO DESTINATION:",
  distance.toFixed(2),
  "meters"
);

if (arrivalCountRef.current >= 1) {
  console.log("====================================");
  console.log("🎉 DESTINATION REACHED");
  console.log("🚕 FINISHING TRIP NOW");
  console.log("====================================");

  finishTrip();
}
  }, [
    driverLocation,
    destination,
    tripEnded,
  ]);


  /* ============================================================
     LOADING
  ============================================================ */

  if (
    !driverLocation ||
    !destination
  ) {
    return (
      <View style={styles.center}>
        <Text>
          Loading trip...
        </Text>
      </View>
    );
  }


  /* ============================================================
     UI
  ============================================================ */

  return (
    <View style={styles.container}>

      <MapView
        ref={mapRef}
        style={styles.map}

        initialRegion={{
          latitude:
            driverLocation.latitude,

          longitude:
            driverLocation.longitude,

          latitudeDelta: 0.01,

          longitudeDelta: 0.01,
        }}
      >

        {/* DRIVER MARKER */}

        <Marker
          coordinate={
            driverLocation
          }
          anchor={{
            x: 0.5,
            y: 0.5,
          }}
        >
          <Image
            source={vehicleImage}
            style={
              styles.markerImage
            }
          />
        </Marker>


        {/* DESTINATION MARKER */}

        <Marker
          coordinate={
            destination
          }
          pinColor="green"
          title="Destination"
        />


        {/* ROUTE */}

        <MapViewDirections
          origin={
            driverLocation
          }

          destination={
            destination
          }

          apikey={
            GOOGLE_MAPS_API_KEY
          }

          strokeWidth={5}

          strokeColor="black"

          onReady={(result) => {
            console.log(
              "🗺️ DIRECTIONS READY"
            );

            console.log(
              "ROUTE DISTANCE:",
              result.distance,
              "km"
            );

            console.log(
              "ROUTE DURATION:",
              result.duration,
              "minutes"
            );

            setDistanceLeft(
              result.distance
            );

            setEta(
              Math.ceil(
                result.duration
              )
            );
          }}

          onError={(error) => {
            console.log(
              "❌ DIRECTIONS ERROR:",
              error
            );
          }}
        />

      </MapView>


      {/* BOTTOM CARD */}

      <View style={styles.card}>

        <Text style={styles.title}>
          Trip in Progress
        </Text>

        <Text style={styles.info}>
          Destination:{" "}
          {
            rideData?.destinationName ||
            "Drop-off"
          }
        </Text>

        <Text style={styles.big}>
          {
            distanceLeft
              ? distanceLeft.toFixed(1)
              : "--"
          }{" "}
          km remaining
        </Text>

        <Text style={styles.info}>
          ETA:{" "}
          {
            eta || "--"
          }{" "}
          min
        </Text>

        <Text style={styles.fare}>
          Fare will be calculated at end
          of trip
        </Text>

      </View>

    </View>
  );
};


export default TripScreen;


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  map: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  markerImage: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: "#fff",

    padding: 20,

    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,

    elevation: 10,

    shadowOpacity: 0.15,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: -3,
    },
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  info: {
    fontSize: 16,
    marginTop: 5,
  },

  big: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 15,
  },

  fare: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },

});