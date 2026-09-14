import React, { useEffect } from "react";

import {
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import auth from "@react-native-firebase/auth";

import {
  ref,
  get,
} from "firebase/database";

import {
  lipaDb,
} from "../firebase/firebase";

const AuthLoading = ({ navigation }) => {

  useEffect(() => {

    const unsubscribe = auth().onAuthStateChanged(
      async (user) => {

        if (!user) {

          console.log("No authenticated user");

          navigation.replace("Login");

          return;

        }

        const uid = user.uid;

        console.log("CURRENT USER:", uid);

        try {

          const passengerRef = ref(
            lipaDb,
            `KandoLipa/clients/${uid}`
          );

          const snapshot = await get(passengerRef);

          if (snapshot.exists()) {

            console.log("Passenger exists");

            navigation.replace("Home");

          } else {

            console.log("New passenger");

            navigation.replace("CompleteProfile");

          }

        } catch (error) {

          console.log(
            "AUTH CHECK ERROR:",
            error
          );

          navigation.replace("Login");

        }

      }
    );

    return () => unsubscribe();

  }, [navigation]);

  return (

    <View style={styles.container}>

      <ActivityIndicator
        size="large"
      />

    </View>

  );

};

export default AuthLoading;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

});