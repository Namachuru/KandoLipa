import React from "react";
import {
   View,
   Text,
   StyleSheet
} from "react-native";

const DriverApproachingScreen = ({
   route
}) => {

   const {
      driver,
      rideData
   } = route.params;

   return (

      <View style={styles.container}>

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
            Driver is approaching your
            pickup point...
         </Text>

      </View>

   );
};

export default DriverApproachingScreen;