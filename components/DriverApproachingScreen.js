import React, { useEffect, useState, useRef } from "react";
import {
   View,
   Text,
   StyleSheet
} from "react-native";
import MapView, {
   Marker
} from "react-native-maps";
import {
   ref,
   onValue
} from "firebase/database";
import { faidaDb } from "../firebase/firebase";

const DriverApproachingScreen = ({ route }) => {

   const {
      driver,
      rideData
   } = route.params;

   const mapRef = useRef(null);

   const [driverLocation, setDriverLocation] = useState(null);

   useEffect(() => {

      const locationRef = ref(
         faidaDb,
         `KandoFaida/mobility_partners/${driver.mp_id}/location`
      );

      const unsubscribe = onValue(locationRef, snapshot => {

         if (!snapshot.exists()) return;

         const location = snapshot.val();

         if (
            location?.lat != null &&
            location?.lng != null
         ) {

            const coords = {
               latitude: location.lat,
               longitude: location.lng
            };

            setDriverLocation(coords);

            mapRef.current?.animateToRegion(
               {
                  ...coords,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
               },
               1000
            );
         }

      });

      return () => unsubscribe();

   }, []);

   if (!driverLocation) {

      return (
         <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
               Loading driver location...
            </Text>
         </View>
      );

   }

   return (

      <View style={styles.container}>

         <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
               latitude: driverLocation.latitude,
               longitude: driverLocation.longitude,
               latitudeDelta: 0.01,
               longitudeDelta: 0.01
            }}
         >

            <Marker
               coordinate={driverLocation}
               title={driver.full_name}
               description="Driver"
            />

         </MapView>

         <View style={styles.infoCard}>

            <Text style={styles.title}>
               Driver Confirmed
            </Text>

            <Text style={styles.name}>
               {driver.full_name}
            </Text>

            <Text style={styles.info}>
               Vehicle: {rideData.type}
            </Text>

            <Text style={styles.info}>
               ETA: {rideData.pickupEta} min
            </Text>

            <Text style={styles.info}>
               Fare: TSh {rideData.fare}
            </Text>

            <Text style={styles.approaching}>
               Driver is approaching your pickup point...
            </Text>

         </View>

      </View>

   );
};

const styles = StyleSheet.create({

   container: {
      flex: 1
   },

   map: {
      ...StyleSheet.absoluteFillObject
   },

   loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
   },

   loadingText: {
      fontSize: 18
   },

   infoCard: {
      position: "absolute",
      left: 15,
      right: 15,
      bottom: 30,
      backgroundColor: "rgba(34,197,94,0.85)",
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)"
   },

   title: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10
   },

   name: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 10
   },

   info: {
      color: "#fff",
      fontSize: 16,
      marginBottom: 5
   },

   approaching: {
      color: "#fff",
      fontSize: 15,
      marginTop: 10
   }

});

export default DriverApproachingScreen;