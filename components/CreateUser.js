import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import auth from "@react-native-firebase/auth";

import {
  ref,
  set,
} from "@react-native-firebase/database";

import {
  lipaDb,
} from "../firebase/firebase";


const CreateUser = ({ navigation }) => {

  // ==================================================
  // FORM STATE
  // ==================================================

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==================================================
  // CREATE USER
  // ==================================================

  const createUser = async () => {

    if (loading) {
      return;
    }


    try {

      // ==================================================
      // GET AUTHENTICATED USER DIRECTLY FROM FIREBASE
      // ==================================================

      const user =
        auth().currentUser;


      console.log(
        "========================================"
      );

      console.log(
        "👤 CREATE USER STARTED"
      );

      console.log(
        "CURRENT FIREBASE USER:",
        user
      );


      // ==================================================
      // MAKE SURE USER IS AUTHENTICATED
      // ==================================================

      if (!user) {

        console.log(
          "❌ NO AUTHENTICATED FIREBASE USER"
        );

        Alert.alert(
          "Authentication Error",
          "Your phone verification session is no longer active. Please log in again."
        );

        navigation.replace("Login");

        return;
      }


      // ==================================================
      // GET UID AND PHONE
      // ==================================================

      const uid =
        user.uid;

      const phoneNumber =
        user.phoneNumber || "";


      console.log(
        "🆔 FIREBASE UID:",
        uid
      );

      console.log(
        "📱 FIREBASE PHONE:",
        phoneNumber
      );


      // ==================================================
      // CLEAN INPUT
      // ==================================================

      const cleanFirstName =
        firstName.trim();

      const cleanLastName =
        lastName.trim();


      // ==================================================
      // VALIDATE FIRST NAME
      // ==================================================

      if (!cleanFirstName) {

        Alert.alert(
          "First Name Required",
          "Please enter your first name."
        );

        return;
      }


      // ==================================================
      // VALIDATE LAST NAME
      // ==================================================

      if (!cleanLastName) {

        Alert.alert(
          "Surname Required",
          "Please enter your surname."
        );

        return;
      }


      setLoading(true);


      // ==================================================
      // FULL NAME
      // ==================================================

      const fullName =
        `${cleanFirstName} ${cleanLastName}`;


      // ==================================================
      // DATABASE PATH
      //
      // KandoLipa
      //    └── clients
      //         └── {Firebase UID}
      //
      // ==================================================

      const databasePath =
        `KandoLipa/clients/${uid}`;


      const clientRef =
        ref(
          lipaDb,
          databasePath
        );


      console.log(
        "📍 DATABASE PATH:",
        databasePath
      );


      // ==================================================
      // CLIENT DATA
      // ==================================================

      const clientData = {

        // Firebase UID
        userId:
          uid,

        client_id:
          uid,


        // Names
        firstName:
          cleanFirstName,

        lastName:
          cleanLastName,

        first_name:
          cleanFirstName,

        last_name:
          cleanLastName,

        full_name:
          fullName,


        // Phone
        phoneNumber:
          phoneNumber,

        phone:
          phoneNumber,


        // Authentication
        authProvider:
          "phone",

        auth_provider:
          "phone",


        // Location
        homeLocation:
          null,

        currentLocation:
          null,


        // Ride state
        isOnline:
          false,

        activeRequestId:
          null,

        activeTripId:
          null,


        // Wallet
        walletBalance:
          0,


        // Rating
        rating:
          5,

        numRatings:
          0,


        // Trips
        totalTrips:
          0,

        completedTrips:
          0,

        cancelledTrips:
          0,


        // Timestamps
        createdAt:
          Date.now(),

        updatedAt:
          Date.now(),

        created_at:
          Date.now(),

      };


      console.log(
        "📦 CLIENT DATA:",
        clientData
      );


      // ==================================================
      // SAVE TO KANDOLIPA DATABASE
      // ==================================================

      await set(
        clientRef,
        clientData
      );


      // ==================================================
      // SUCCESS
      // ==================================================

      console.log(
        "✅ CLIENT CREATED SUCCESSFULLY"
      );

      console.log(
        "🆔 CLIENT UID:",
        uid
      );

      console.log(
        "📍 SAVED PATH:",
        databasePath
      );


      // ==================================================
      // GO HOME
      // ==================================================

      navigation.replace(
        "Home"
      );


    } catch (error) {

      console.log(
        "========================================"
      );

      console.log(
        "❌ CREATE USER ERROR:",
        error
      );

      console.log(
        "❌ ERROR CODE:",
        error?.code
      );

      console.log(
        "❌ ERROR MESSAGE:",
        error?.message
      );

      console.log(
        "========================================"
      );


      Alert.alert(
        "Account Creation Failed",
        error?.message ||
          "Unable to create your KandoLipa account."
      );


    } finally {

      setLoading(false);

    }

  };


  // ==================================================
  // UI
  // ==================================================

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Create Your Account
      </Text>


      <Text style={styles.subtitle}>
        Tell us your name to complete your KandoLipa account.
      </Text>


      {/* VERIFIED PHONE */}

      <View style={styles.phoneBox}>

        <Text style={styles.phoneLabel}>
          Verified Phone Number
        </Text>

        <Text style={styles.phoneText}>
          {auth().currentUser?.phoneNumber ||
            "Phone number unavailable"}
        </Text>

      </View>


      {/* FIRST NAME */}

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!loading}
      />


      {/* LAST NAME */}

      <TextInput
        style={styles.input}
        placeholder="Surname"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!loading}
      />


      {/* CREATE ACCOUNT */}

      <TouchableOpacity
        style={[
          styles.button,
          loading &&
            styles.buttonDisabled,
        ]}
        onPress={createUser}
        disabled={loading}
      >

        {loading ? (

          <ActivityIndicator
            color="#fff"
          />

        ) : (

          <Text style={styles.buttonText}>
            Create Account
          </Text>

        )}

      </TouchableOpacity>

    </View>

  );

};


export default CreateUser;


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,

    justifyContent: "center",

    padding: 20,

    backgroundColor: "#FFF2A0",
  },


  title: {
    fontSize: 28,

    fontWeight: "bold",

    textAlign: "center",

    marginBottom: 10,
  },


  subtitle: {
    textAlign: "center",

    marginBottom: 30,

    opacity: 0.7,

    lineHeight: 20,
  },


  phoneBox: {
    backgroundColor: "#f1f5f9",

    borderRadius: 10,

    padding: 15,

    marginBottom: 20,

    borderWidth: 1,

    borderColor: "#e2e8f0",
  },


  phoneLabel: {
    fontSize: 13,

    opacity: 0.6,

    marginBottom: 5,
  },


  phoneText: {
    fontSize: 17,

    fontWeight: "600",
  },


  input: {
    backgroundColor: "#fff",

    borderWidth: 1,

    borderColor: "#ddd",

    borderRadius: 10,

    padding: 15,

    fontSize: 17,

    marginBottom: 15,
  },


  button: {
    backgroundColor: "#22c55e",

    padding: 16,

    borderRadius: 10,

    alignItems: "center",

    marginTop: 5,
  },


  buttonDisabled: {
    opacity: 0.6,
  },


  buttonText: {
    color: "#fff",

    fontWeight: "bold",

    fontSize: 17,
  },

});
