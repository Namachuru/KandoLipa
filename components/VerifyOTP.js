import React, {useState} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import {
  getPhoneConfirmation,
  clearPhoneConfirmation,
} from "../firebase/phoneAuth";


const VerifyOTP = ({navigation}) => {

  // ==================================================
  // STATE
  // ==================================================

  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // ==================================================
  // VERIFY SMS CODE
  // ==================================================

  const verifyCode = async () => {

    if (loading) {
      return;
    }


    // ==================================================
    // GET SMS AUTHENTICATION SESSION
    // ==================================================

    const confirmation =
      getPhoneConfirmation();


    // ==================================================
    // CHECK CONFIRMATION
    // ==================================================

    if (!confirmation) {

      console.log(
        "❌ NO SMS CONFIRMATION OBJECT"
      );

      Alert.alert(
        "Verification Error",
        "Your verification session has expired. Please request a new code."
      );

      navigation.goBack();

      return;
    }


    // ==================================================
    // CHECK CODE
    // ==================================================

    const trimmedCode =
      code.trim();


    if (!trimmedCode) {

      Alert.alert(
        "Missing Code",
        "Enter the SMS verification code."
      );

      return;
    }


    // ==================================================
    // CODE MUST BE 6 DIGITS
    // ==================================================

    if (!/^\d{6}$/.test(trimmedCode)) {

      Alert.alert(
        "Invalid Code",
        "Please enter the 6-digit verification code."
      );

      return;
    }


    try {

      setLoading(true);


      console.log(
        "🔐 VERIFYING SMS CODE..."
      );


      // ==================================================
      // FIREBASE PHONE AUTHENTICATION
      // ==================================================

      const result =
        await confirmation.confirm(
          trimmedCode
        );


      // ==================================================
      // GET FIREBASE USER
      // ==================================================

      const user =
        result?.user;


      if (!user) {

        throw new Error(
          "Firebase did not return an authenticated user."
        );
      }


      // ==================================================
      // AUTHENTICATED USER INFORMATION
      // ==================================================

      const uid =
        user.uid;

      const phoneNumber =
        user.phoneNumber;


      console.log(
        "✅ SMS AUTHENTICATION SUCCESSFUL"
      );

      console.log(
        "🆔 FIREBASE UID:",
        uid
      );

      console.log(
        "📱 PHONE NUMBER:",
        phoneNumber
      );


      // ==================================================
      // CLEAR SMS SESSION
      // ==================================================

      clearPhoneConfirmation();


      // ==================================================
      // GO TO CREATE USER
      //
      // Firebase Authentication is now complete.
      //
      // CreateUser will collect the client's
      // personal information.
      //
      // KandoLipa
      // └── clients
      //     └── {uid}
      // ==================================================

      navigation.replace(
        "CreateUser",
        {
          uid,
          phoneNumber,
        }
      );


    } catch (error) {

      console.log(
        "❌ SMS VERIFICATION ERROR:",
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


      // ==================================================
      // USER-FRIENDLY ERRORS
      // ==================================================

      let message =
        "Unable to verify the SMS code. Please try again.";


      if (
        error?.code ===
        "auth/invalid-verification-code"
      ) {

        message =
          "The SMS verification code is incorrect.";

      } else if (
        error?.code ===
        "auth/code-expired"
      ) {

        message =
          "The SMS verification code has expired. Please request a new code.";

      } else if (
        error?.message
      ) {

        message =
          error.message;
      }


      Alert.alert(
        "Verification Failed",
        message
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
        Verify Phone Number
      </Text>


      <Text style={styles.subtitle}>
        Enter the SMS code sent to your phone
      </Text>


      <TextInput

        style={styles.input}

        placeholder="123456"

        keyboardType="number-pad"

        maxLength={6}

        value={code}

        onChangeText={setCode}

        editable={!loading}

        autoFocus={true}

      />


      <TouchableOpacity

        style={[
          styles.button,
          loading &&
            styles.buttonDisabled,
        ]}

        onPress={verifyCode}

        disabled={loading}

      >

        <Text style={styles.buttonText}>

          {loading
            ? "Verifying..."
            : "Verify"}

        </Text>

      </TouchableOpacity>

    </View>

  );
};


export default VerifyOTP;


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
    fontSize: 26,

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

    padding: 18,

    fontSize: 22,

    textAlign: "center",

    letterSpacing: 10,

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

});