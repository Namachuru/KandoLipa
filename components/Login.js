import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import auth from "@react-native-firebase/auth";

const Login = ({ navigation }) => {

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const sendOTP = async () => {

    if (loading) return;


    if (!phoneNumber.trim()) {

      Alert.alert(
        "Phone Number Required",
        "Please enter your phone number."
      );

      return;
    }


    try {

      setLoading(true);


      // Tanzania example:
      // 0712345678 becomes +255712345678

      let formattedPhone =
        phoneNumber
          .replace(/\D/g, "")
          .replace(/^0/, "");


      formattedPhone =
        `+255${formattedPhone}`;


      console.log(
        "Sending OTP to:",
        formattedPhone
      );

      const confirmation =
        await auth().signInWithPhoneNumber(formattedPhone);

      console.log("SMS request accepted.");
      console.log(confirmation);

      navigation.navigate(
        "VerifyOTP",
        {
          confirmation,
        }
      );


    } catch (error) {

      /*console.log(
        "PHONE LOGIN ERROR:",
        error
      );


      Alert.alert(
        "Login Failed",
        error.message
      );*/

      console.log("CODE:", error.code);
      console.log("MESSAGE:", error.message);
      console.log("FULL ERROR:", error);

      Alert.alert(
        "Login Failed",
        `${error.code}\n${error.message}`
      );
    } finally {

      setLoading(false);

    }

  };


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

        placeholder="Phone Number"

        keyboardType="phone-pad"

        value={phoneNumber}

        onChangeText={setPhoneNumber}

        maxLength={10}

      />



      <TouchableOpacity

        style={styles.button}

        onPress={sendOTP}

        disabled={loading}

      >

        <Text style={styles.buttonText}>

          {
            loading
            ? "Sending..."
            : "Continue"
          }

        </Text>

      </TouchableOpacity>



      <View style={styles.divider}>

        <Text>
          OR
        </Text>

      </View>



      <TouchableOpacity

        style={styles.googleButton}

        onPress={() =>
          Alert.alert(
            "Google Login",
            "Google login will be added next."
          )
        }

      >

        <Text style={styles.googleText}>
          Continue with Google
        </Text>

      </TouchableOpacity>



      <TouchableOpacity

        style={styles.facebookButton}

        onPress={() =>
          Alert.alert(
            "Facebook Login",
            "Facebook login will be added later."
          )
        }

      >

        <Text style={styles.facebookText}>
          Continue with Facebook
        </Text>

      </TouchableOpacity>


    </View>

  );

};


export default Login;



const styles = StyleSheet.create({

  container:{
    flex:1,
    justifyContent:"center",
    padding:20,
    backgroundColor:"#FFF2A0",
  },


  title:{
    fontSize:28,
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
    padding:15,
    fontSize:18,
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


  divider:{
    alignItems:"center",
    marginVertical:25,
  },


  googleButton:{
    backgroundColor:"#fff",
    padding:15,
    borderRadius:10,
    alignItems:"center",
    marginBottom:12,
    borderWidth:1,
    borderColor:"#ddd",
  },


  googleText:{
    fontWeight:"bold",
    fontSize:16,
  },


  facebookButton:{
    backgroundColor:"#1877F2",
    padding:15,
    borderRadius:10,
    alignItems:"center",
  },


  facebookText:{
    color:"#fff",
    fontWeight:"bold",
    fontSize:16,
  },


});