import React, {useState} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  ref,
  set,
} from "@react-native-firebase/database";

import {
  lipaDb,
} from "../firebase/firebase";


const CreateUser = ({route, navigation}) => {

  // ==================================================
  // AUTHENTICATED USER DATA
  // ==================================================

  const {
    uid,
    phoneNumber,
  } = route.params || {};


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
  // CREATE CLIENT
  // ==================================================

  const createUser = async () => {

    if (loading) {
      return;
    }


    // ==================================================
    // CHECK AUTH DATA
    // ==================================================

    if (!uid) {

      console.log(
        "❌ CREATE USER: Firebase UID missing"
      );

      Alert.alert(
        "Authentication Error",
        "Your authenticated user could not be identified. Please log in again."
      );

      return;
    }


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


    try {

      setLoading(true);


      console.log(
        "👤 CREATING KANDOLIPA CLIENT"
      );

      console.log(
        "🆔 FIREBASE UID:",
        uid
      );

      console.log(
        "📱 PHONE:",
        phoneNumber
      );


      // ==================================================
      // FULL NAME
      // ==================================================

      const fullName =
        `${cleanFirstName} ${cleanLastName}`;


      // ==================================================
      // CLIENT DATABASE REFERENCE
      //
      // KandoLipa
      //    └── clients
      //         └── {uid}
      //
      // ==================================================

      const clientRef =
        ref(
          lipaDb,
          `KandoLipa/clients/${uid}`
        );


      // ==================================================
      // CLIENT DATA
      // ==================================================

      const clientData = {

        // Firebase Authentication UID
        client_id: uid,

        // Name
        first_name: cleanFirstName,

        last_name: cleanLastName,

        full_name: fullName,

        // Phone verified by Firebase
        phone: phoneNumber || "",

        // Authentication method
        auth_provider: "phone",

        // Account creation time
        created_at: Date.now(),

      };


      // ==================================================
      // SAVE CLIENT
      // ==================================================

      await set(
        clientRef,
        clientData
      );


      console.log(
        "✅ CLIENT CREATED SUCCESSFULLY"
      );

      console.log(
        "📍 DATABASE PATH:",
        `KandoLipa/clients/${uid}`
      );


      // ==================================================
      // GO TO HOME
      // ==================================================

      navigation.replace(
        "Home"
      );


    } catch (error) {

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

      {/* ==================================================
          TITLE
      ================================================== */}

      <Text style={styles.title}>
        Create Your Account
      </Text>


      {/* ==================================================
          SUBTITLE
      ================================================== */}

      <Text style={styles.subtitle}>
        Tell us your name to complete your KandoLipa account.
      </Text>


      {/* ==================================================
          PHONE NUMBER
      ================================================== */}

      <View style={styles.phoneBox}>

        <Text style={styles.phoneLabel}>
          Verified Phone Number
        </Text>

        <Text style={styles.phoneText}>
          {phoneNumber || "Phone number unavailable"}
        </Text>

      </View>


      {/* ==================================================
          FIRST NAME
      ================================================== */}

      <TextInput
        style={styles.input}

        placeholder="First Name"

        value={firstName}

        onChangeText={setFirstName}

        autoCapitalize="words"

        autoCorrect={false}

        editable={!loading}
      />


      {/* ==================================================
          LAST NAME
      ================================================== */}

      <TextInput
        style={styles.input}

        placeholder="Surname"

        value={lastName}

        onChangeText={setLastName}

        autoCapitalize="words"

        autoCorrect={false}

        editable={!loading}
      />


      {/* ==================================================
          CREATE ACCOUNT BUTTON
      ================================================== */}

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