// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

//KandoLipa
const lipaConfig = {
  apiKey: "AIzaSyBchOfSFS2IX-w1uaqGDSM1x3KELZ9HTsw",
  authDomain: "kandolipa-e839b.firebaseapp.com",
  databaseURL: "https://kandolipa-e839b-default-rtdb.firebaseio.com",
  projectId: "kandolipa-e839b",
  storageBucket: "kandolipa-e839b.firebasestorage.app",
  messagingSenderId: "745437046606",
  appId: "1:745437046606:web:a0e3e82f884240d116e01f"
};

const lipaApp = initializeApp(lipaConfig);

export const auth = initializeAuth(lipaApp, { persistence: getReactNativePersistence(AsyncStorage),});
export const lipaDb = getDatabase(lipaApp);
export const functions = getFunctions(lipaApp);

//KandoFaida
const faidaConfig = {
  apiKey: "AIzaSyCjU-vBbsZ2aYvhQacP6xZtiD09cGQ_crI",
  authDomain: "kandofaida-18662.firebaseapp.com",
  databaseURL: "https://kandofaida-18662-default-rtdb.firebaseio.com",
  projectId: "kandofaida-18662",
  storageBucket: "kandofaida-18662.firebasestorage.app",
  messagingSenderId: "454996214392",
  appId: "1:454996214392:web:35a3965949de939497a38d"
};

const faidaApp = initializeApp(faidaConfig, "KandoFaida");
export const faidaDb = getDatabase(faidaApp);