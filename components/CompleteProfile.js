import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import * as Location from "expo-location";

import {
  ref,
  set,
} from "firebase/database";

import {
  lipaDb,
} from "../firebase/firebase";

import auth from "@react-native-firebase/auth";

const CompleteProfile = ({ navigation }) => {

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [location, setLocation] =
    useState(null);

  const [loading, setLoading] =
    useState(false);



  useEffect(() => {

    const getLocation = async () => {

      try {

        const permission =
          await Location.requestForegroundPermissionsAsync();


        if (permission.status !== "granted") {

          Alert.alert(
            "Location Required",
            "Location helps us provide better rides."
          );

          return;
        }


        const position =
          await Location.getCurrentPositionAsync({
            accuracy:
              Location.Accuracy.Highest,
          });


        setLocation({

          lat:
            position.coords.latitude,

          lng:
            position.coords.longitude,

        });


      } catch(error) {

        console.log(error);

      }

    };


    getLocation();


  }, []);



  const saveProfile = async () => {


    if (loading) return;


    const user =
      auth().currentUser;



    if (!user) {

      Alert.alert(
        "Login Required",
        "Please login again."
      );

      navigation.replace("Login");

      return;

    }



    if (!firstName.trim()) {

      Alert.alert(
        "Missing Name",
        "Enter your first name."
      );

      return;

    }



    if (!lastName.trim()) {

      Alert.alert(
        "Missing Name",
        "Enter your last name."
      );

      return;

    }



    if (!location) {

      Alert.alert(
        "Location",
        "Waiting for location."
      );

      return;

    }



    try {

      setLoading(true);



      const uid =
        user.uid;



      const passengerData = {


        userId: uid,


        firstName:
          firstName.trim(),


        lastName:
          lastName.trim(),


        phoneNumber:
          user.phoneNumber || null,


        email:
          email.trim(),


        authProvider:
          user.providerData?.[0]?.providerId ||
          "phone",



        homeLocation:
          location,


        currentLocation:
          location,



        isOnline:
          true,



        activeRequestId:
          null,


        activeTripId:
          null,



        walletBalance:
          0,



        rating:
          5,



        totalTrips:
          0,


        completedTrips:
          0,


        cancelledTrips:
          0,



        createdAt:
          Date.now(),



        updatedAt:
          Date.now(),

      };



      await set(

        ref(
          lipaDb,
          `KandoLipa/clients/${uid}`
        ),

        passengerData

      );



      console.log(
        "PROFILE CREATED:",
        uid
      );



      navigation.replace(
        "Home"
      );



    } catch(error) {


      console.log(
        "PROFILE ERROR:",
        error
      );


      Alert.alert(
        "Error",
        "Could not save profile."
      );


    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
  console.log("CURRENT USER:", auth().currentUser);
console.log("UID:", auth().currentUser?.uid);
}, []);
  return (

    <View style={styles.container}>


      <Text style={styles.title}>
        Complete Profile
      </Text>



      <TextInput

        style={styles.input}

        placeholder="First Name"

        value={firstName}

        onChangeText={setFirstName}

      />



      <TextInput

        style={styles.input}

        placeholder="Last Name"

        value={lastName}

        onChangeText={setLastName}

      />



      <TextInput

        style={styles.input}

        placeholder="Email (optional)"

        keyboardType="email-address"

        autoCapitalize="none"

        value={email}

        onChangeText={setEmail}

      />



      <TouchableOpacity

        style={styles.button}

        onPress={saveProfile}

        disabled={loading}

      >

        <Text style={styles.buttonText}>

          {
            loading
            ? "Saving..."
            : "Continue"
          }

        </Text>


      </TouchableOpacity>


    </View>

  );

};


export default CompleteProfile;



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
    marginBottom:30,
  },


  input:{
    backgroundColor:"#fff",
    borderWidth:1,
    borderColor:"#ddd",
    borderRadius:10,
    padding:15,
    marginBottom:15,
    fontSize:16,
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