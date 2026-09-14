import React, {useState} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import auth from "@react-native-firebase/auth";

import {
  setPhoneConfirmation,
} from "../firebase/phoneAuth";

import {
  ref,
  set,
} from "@react-native-firebase/database";

import {lipaDb} from "../firebase/firebase";


const Login = ({navigation}) => {

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==================================================
  // SEND OTP
  // ==================================================

  const sendOTP = async () => {

    if (loading) {
      return;
    }

    const cleanedNumber =
      phoneNumber.replace(/\D/g, "");

    // Tanzania phone number validation

    if (!/^0\d{9}$/.test(cleanedNumber)) {

      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid Tanzanian phone number.\n\nExample: 0712345678"
      );

      return;
    }

    // Convert 0712345678 → +255712345678

    const formattedPhone =
      `+255${cleanedNumber.substring(1)}`;


    try {

      setLoading(true);

      console.log(
        "📱 PHONE NUMBER ENTERED:",
        cleanedNumber
      );

      console.log(
        "🌍 FORMATTED PHONE NUMBER:",
        formattedPhone
      );

      console.log(
        "📤 CALLING FIREBASE signInWithPhoneNumber..."
      );


      const confirmation =
        await auth().signInWithPhoneNumber(
          formattedPhone
        );


      console.log(
        "📥 FIREBASE signInWithPhoneNumber RETURNED"
      );

      console.log(
        "✅ SMS REQUEST ACCEPTED"
      );


      // Store confirmation outside navigation
      // so React Navigation does not complain
      // about non-serializable Firebase objects.

      setPhoneConfirmation(
        confirmation
      );


      // Go to OTP screen

      navigation.navigate(
        "VerifyOTP"
      );


    } catch (error) {

      console.log(
        "❌ PHONE LOGIN ERROR:",
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


      Alert.alert(
        "Login Failed",
        `${error?.code || "unknown"}\n${
          error?.message ||
          "Unable to send verification code."
        }`
      );


    } finally {

      setLoading(false);

    }
  };


  // ==================================================
  // DEVELOPMENT LOGIN
  //
  // DEVELOPMENT ONLY
  //
  // Creates a Firebase anonymous user and a
  // default KandoLipa client record.
  //
  // REMOVE BEFORE PRODUCTION.
  // ==================================================

  const developerLogin = async () => {

    if (loading) {
      return;
    }


    try {

      setLoading(true);


      console.log(
        "🧪 DEVELOPMENT LOGIN STARTED"
      );


      // ------------------------------------------------
      // GET CURRENT FIREBASE USER
      // ------------------------------------------------

      let user =
        auth().currentUser;


      // ------------------------------------------------
      // CREATE ANONYMOUS USER IF NONE EXISTS
      // ------------------------------------------------

      if (!user) {

        console.log(
          "🧪 Creating anonymous Firebase user..."
        );


        const result =
          await auth().signInAnonymously();


        user =
          result.user;

      }


      if (!user) {

        throw new Error(
          "Firebase did not return a user."
        );

      }


      const uid =
        user.uid;


      console.log(
        "🧪 DEVELOPMENT UID:",
        uid
      );


      // ==================================================
      // DEFAULT CLIENT DATA
      // ==================================================

      const clientData = {

        // Firebase Authentication UID

        userId:
          uid,


        // Default name

        firstName:
          "Test",


        lastName:
          "Client",


        // Development phone

        phoneNumber:
          "+255700000000",


        // No email required

        email:
          "",


        // No location yet

        homeLocation:
          null,


        currentLocation:
          null,


        // Client starts offline

        isOnline:
          false,


        // No active ride

        activeRequestId:
          null,


        activeTripId:
          null,


        // Wallet starts at zero

        walletBalance:
          0,


        // Trip statistics

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

      };


      // ==================================================
      // SAVE CLIENT
      //
      // KandoLipa
      // └── clients
      //     └── {uid}
      // ==================================================

      const clientRef =
        ref(
          lipaDb,
          `KandoLipa/clients/${uid}`
        );


      await set(
        clientRef,
        clientData
      );


      console.log(
        "✅ DEFAULT CLIENT PROFILE CREATED"
      );


      console.log(
        "🆔 CLIENT UID:",
        uid
      );


      console.log(
        "📦 CLIENT DATA:",
        clientData
      );


      // ==================================================
      // GO DIRECTLY TO HOME
      // ==================================================

      navigation.replace(
        "Home"
      );


    } catch (error) {

      console.log(
        "❌ DEVELOPMENT LOGIN ERROR:",
        error
      );


      console.log(
        "❌ ERROR CODE:",
        error?.code
      );


      Alert.alert(
        "Developer Login Failed",
        error?.message ||
          "Unable to create development user."
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
        Welcome to KandoLipa
      </Text>


      <Text style={styles.subtitle}>
        Enter your phone number to continue
      </Text>


      <TextInput

        style={styles.input}

        placeholder="0712345678"

        keyboardType="phone-pad"

        value={phoneNumber}

        onChangeText={setPhoneNumber}

        maxLength={10}

        editable={!loading}

        autoCapitalize="none"

        autoCorrect={false}

      />


      {/* ==================================================
          NORMAL PHONE LOGIN
      ================================================== */}

      <TouchableOpacity

        style={[
          styles.button,
          loading &&
            styles.buttonDisabled,
        ]}

        onPress={sendOTP}

        disabled={loading}

      >

        <Text style={styles.buttonText}>

          {loading
            ? "Sending..."
            : "Continue"}

        </Text>

      </TouchableOpacity>


      {/* ==================================================
          DEVELOPMENT LOGIN
      ================================================== */}

      {__DEV__ && (

        <TouchableOpacity

          style={
            styles.developerButton
          }

          onPress={
            developerLogin
          }

          disabled={loading}

        >

          <Text
            style={
              styles.developerButtonText
            }
          >

            {loading
              ? "Creating..."
              : "Developer Login"}

          </Text>

        </TouchableOpacity>

      )}

    </View>

  );

};


export default Login;


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
  },


  input: {
    backgroundColor: "#fff",

    borderWidth: 1,

    borderColor: "#ddd",

    borderRadius: 10,

    padding: 15,

    fontSize: 18,

    marginBottom: 20,
  },


  button: {
    backgroundColor: "#22c55e",

    padding: 16,

    borderRadius: 10,

    alignItems: "center",
  },


  buttonDisabled: {
    opacity: 0.6,
  },


  buttonText: {
    color: "#fff",

    fontWeight: "bold",

    fontSize: 17,
  },


  developerButton: {
    marginTop: 20,

    backgroundColor: "#f59e0b",

    padding: 14,

    borderRadius: 10,

    alignItems: "center",
  },


  developerButtonText: {
    color: "#fff",

    fontWeight: "bold",

    fontSize: 16,
  },

});