import React, { useEffect } from "react";

import {
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  ref,
  get,
} from "firebase/database";

import {
  auth,
  lipaDb,
} from "../firebase/firebase";


const AuthLoading = ({ navigation }) => {


  useEffect(() => {


    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {


          if (!user) {

            navigation.replace(
              "Login"
            );

            return;

          }



          const uid =
            user.uid;



          console.log(
            "CURRENT USER:",
            uid
          );



          try {


            const passengerRef =
              ref(
                lipaDb,
                `KandoLipa/passenger/${uid}`
              );


            const snapshot =
              await get(passengerRef);



            if (snapshot.exists()) {


              console.log(
                "Passenger exists"
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
              "AUTH CHECK ERROR:",
              error
            );


            navigation.replace(
              "Login"
            );


          }


        }
      );


      return () =>
        unsubscribe();


  }, []);



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

  container:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
  },

});