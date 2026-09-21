import React, {
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createStackNavigator,
} from "@react-navigation/stack";

import AsyncStorage from
  "@react-native-async-storage/async-storage";


import SplashSrc from "./components/SplashSrc";
import AuthLoading from "./components/AuthLoading";
import Login from "./components/Login";
import VerifyOTP from "./components/VerifyOTP";
import CreateUser from "./components/CreateUser";
import Home from "./components/Home";
import Shop from "./components/Shop";
import RealEstate from "./components/RealEstate";
import Taxi from "./components/Taxi";
import FetchingDriver from "./components/FetchingDriver";
import SearchingDriver from "./components/SearchingDriver";
import DriverApproaching from "./components/DriverApproachingScreen";
import Trip from "./components/TripScreen";
import Arrived from "./components/ArrivedScreen";


const Stack =
  createStackNavigator();


// ======================================================
// NAVIGATION PERSISTENCE KEY
// ======================================================

const NAVIGATION_STATE_KEY =
  "@KandoLipa/navigation_state";


// ======================================================
// NAVIGATION STATE EXPIRATION
// ======================================================

// Saved navigation is only valid for 5 minutes.
//
// If the app is reopened after more than 5 minutes,
// the old navigation state is discarded and the app
// starts normally from Splash/AuthLoading.

const NAVIGATION_STATE_EXPIRATION_MS =
  5 * 60 * 1000;


// ======================================================
// APP
// ======================================================

export default function App() {

  // ====================================================
  // NAVIGATION STATE
  // ====================================================

  const [
    initialState,
    setInitialState,
  ] = useState(undefined);


  const [
    isReady,
    setIsReady,
  ] = useState(false);


  // ====================================================
  // RESTORE NAVIGATION STATE
  // ====================================================

  useEffect(() => {

    const restoreNavigationState =
      async () => {

        try {

          console.log(
            "=========================================="
          );

          console.log(
            "🔄 RESTORING KANDOLIPA NAVIGATION"
          );

          console.log(
            "=========================================="
          );


          const savedState =
            await AsyncStorage.getItem(
              NAVIGATION_STATE_KEY
            );


          if (savedState) {

            const parsedData =
              JSON.parse(savedState);


            // ------------------------------------------------
            // NEW FORMAT:
            //
            // {
            //   state: navigationState,
            //   savedAt: timestamp
            // }
            // ------------------------------------------------

            const savedNavigationState =
              parsedData?.state;

            const savedAt =
              Number(
                parsedData?.savedAt || 0
              );


            // ------------------------------------------------
            // CHECK THAT THIS IS A VALID SAVED STATE
            // ------------------------------------------------

            if (
              savedNavigationState &&
              savedAt > 0
            ) {

              const age =
                Date.now() -
                savedAt;


              console.log(
                "⏱️ SAVED NAVIGATION AGE:",
                Math.round(
                  age / 1000
                ),
                "seconds"
              );


              // ==============================================
              // NAVIGATION STATE STILL VALID
              // ==============================================

              if (
                age <=
                NAVIGATION_STATE_EXPIRATION_MS
              ) {

                console.log(
                  "✅ SAVED NAVIGATION STATE IS STILL VALID"
                );


                console.log(
                  "📍 SAVED CURRENT ROUTE:",
                  savedNavigationState?.routes?.[
                    savedNavigationState.index
                  ]?.name
                );


                setInitialState(
                  savedNavigationState
                );


              } else {

                // ==========================================
                // NAVIGATION STATE EXPIRED
                // ==========================================

                console.log(
                  "⏰ SAVED NAVIGATION STATE HAS EXPIRED"
                );

                console.log(
                  "🗑️ CLEARING OLD NAVIGATION STATE"
                );


                await AsyncStorage.removeItem(
                  NAVIGATION_STATE_KEY
                );


                // Start normally from Splash.
                setInitialState(
                  undefined
                );

              }


            } else {

              // ------------------------------------------------
              // OLD FORMAT / CORRUPTED STATE
              //
              // This also handles the navigation state that
              // was saved by the previous version of App.js.
              // ------------------------------------------------

              console.log(
                "⚠️ OLD OR INVALID NAVIGATION STATE FORMAT"
              );


              console.log(
                "🗑️ CLEARING OLD NAVIGATION STATE"
              );


              await AsyncStorage.removeItem(
                NAVIGATION_STATE_KEY
              );


              setInitialState(
                undefined
              );

            }


          } else {

            console.log(
              "ℹ️ NO SAVED NAVIGATION STATE"
            );

          }


        } catch (error) {

          console.log(
            "❌ NAVIGATION RESTORE ERROR:",
            error
          );


          // If saved navigation is corrupted,
          // clear it and start normally from Splash.

          try {

            await AsyncStorage.removeItem(
              NAVIGATION_STATE_KEY
            );

          } catch (clearError) {

            console.log(
              "❌ FAILED TO CLEAR NAVIGATION STATE:",
              clearError
            );

          }


          setInitialState(
            undefined
          );


        } finally {

          setIsReady(
            true
          );

        }

      };


    restoreNavigationState();

  }, []);


  // ====================================================
  // WAIT UNTIL NAVIGATION STATE IS RESTORED
  // ====================================================

  if (!isReady) {

    return (

      <View
        style={
          styles.loadingContainer
        }
      >

        <ActivityIndicator
          size="large"
        />

      </View>

    );

  }


  // ====================================================
  // APP
  // ====================================================

  return (

    <NavigationContainer

      initialState={
        initialState
      }

      onStateChange={
        async (state) => {

          try {

            // ------------------------------------------
            // SAVE CURRENT NAVIGATION STATE
            // ------------------------------------------

            const navigationData = {

              state,

              savedAt:
                Date.now(),

            };


            await AsyncStorage.setItem(

              NAVIGATION_STATE_KEY,

              JSON.stringify(
                navigationData
              )

            );


            // ------------------------------------------
            // LOG CURRENT SCREEN
            // ------------------------------------------

            const currentRoute =
              state?.routes?.[
                state.index
              ]?.name;


            console.log(
              "💾 NAVIGATION SAVED:",
              currentRoute
            );


            console.log(
              "⏱️ NAVIGATION EXPIRATION:",
              "5 minutes"
            );


          } catch (error) {

            console.log(
              "❌ NAVIGATION SAVE ERROR:",
              error
            );

          }

        }
      }

    >

      <Stack.Navigator
        initialRouteName="Splash"
      >

        <Stack.Screen
          name="Splash"
          component={SplashSrc}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="AuthLoading"
          component={AuthLoading}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Login"
          component={Login}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="VerifyOTP"
          component={VerifyOTP}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="CreateUser"
          component={CreateUser}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Shop"
          component={Shop}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Real Estate"
          component={RealEstate}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Taxi"
          component={Taxi}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="FetchingDriver"
          component={FetchingDriver}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="SearchingDriver"
          component={SearchingDriver}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="DriverApproaching"
          component={DriverApproaching}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Trip"
          component={Trip}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Arrived"
          component={Arrived}
          options={{
            headerShown: false,
          }}
        />

      </Stack.Navigator>

    </NavigationContainer>

  );

}


// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },

    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },

    title: {
      fontSize: 26,
      fontWeight: "700",
    },

    subtitle: {
      fontSize: 16,
      color: "#666",
    },

  });
