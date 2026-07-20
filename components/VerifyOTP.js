import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import {
  ref,
  get,
} from "firebase/database";

import {
  auth,
  lipaDb,
} from "../firebase/firebase";


const VerifyOTP = ({ route, navigation }) => {

  const { confirmation } =
    route.params || {};


  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);



  const verifyCode = async () => {

    if (loading) return;


    if (!code.trim()) {

      Alert.alert(
        "Missing Code",
        "Enter the SMS verification code."
      );

      return;
    }


    try {

      setLoading(true);


      const result =
        confirmation.confirm(code);


      const user =
        result.user;


      const uid =
        user.uid;


      console.log(
        "AUTH UID:",
        uid
      );


      /*
        Check if passenger profile exists

        KandoLipa
             |
             passenger
                  |
                  UID
      */


      const passengerRef =
        ref(
          lipaDb,
          `KandoLipa/passenger/${uid}`
        );


      const snapshot =
        await get(passengerRef);



      if (snapshot.exists()) {


        console.log(
          "Existing passenger"
        );


        navigation.replace(
          "Home"
        );


      } else {


        console.log(
          "New passenger"
        );


        navigation.replace(
          "CompleteProfile"
        );


      }


    } catch(error) {


      console.log(
        "OTP ERROR:",
        error
      );


      Alert.alert(
        "Verification Failed",
        "Incorrect code. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };



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

      />



      <TouchableOpacity

        style={styles.button}

        onPress={verifyCode}

        disabled={loading}

      >

        <Text style={styles.buttonText}>

          {
            loading
            ? "Verifying..."
            : "Verify"
          }

        </Text>


      </TouchableOpacity>


    </View>

  );

};


export default VerifyOTP;



const styles = StyleSheet.create({

  container:{
    flex:1,
    justifyContent:"center",
    padding:20,
    backgroundColor:"#FFF2A0",
  },


  title:{
    fontSize:26,
    fontWeight:"bold",
    textAlign:"center",
    marginBottom:10,
  },


  subtitle:{
    textAlign:"center",
    marginBottom:30,
    opacity:0.7,
  },


  input:{
    backgroundColor:"#fff",
    borderWidth:1,
    borderColor:"#ddd",
    borderRadius:10,
    padding:18,
    fontSize:22,
    textAlign:"center",
    letterSpacing:10,
    marginBottom:20,
  },


  button:{
    backgroundColor:"#22c55e",
    padding:16,
    borderRadius:10,
    alignItems:"center",
  },


  buttonText:{
    color:"#fff",
    fontWeight:"bold",
    fontSize:17,
  },


});