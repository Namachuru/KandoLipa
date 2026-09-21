import React, { useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";

import auth from "@react-native-firebase/auth";

import {
  ref,
  get,
} from "@react-native-firebase/database";

import {
  lipaDb,
} from "../firebase/firebase";

export default function AuthLoading({ navigation }) {
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      try {
        // No authenticated user
        if (!user) {
          navigation.replace("Login");
          return;
        }

        const uid = user.uid;

        // Check whether the passenger profile already exists
        const passengerRef = ref(
          lipaDb,
          `KandoLipa/clients/${uid}`
        );

        const snapshot = await get(passengerRef);

        if (snapshot.exists()) {
          // Existing passenger
          navigation.replace("Home");
        } else {
          // Authenticated but profile does not exist yet
          navigation.replace("CreateUser");
        }
      } catch (error) {
        console.log("AuthLoading error:", error);

        Alert.alert(
          "Error",
          "Unable to check your account. Please try again."
        );

        navigation.replace("Login");
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});