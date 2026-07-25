// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

//KandoLipa
const lipaConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const lipaApp = initializeApp(lipaConfig);

export const auth = initializeAuth(lipaApp, { persistence: getReactNativePersistence(AsyncStorage)});
export const lipaDb = getDatabase(lipaApp);
export const functions = getFunctions(lipaApp);

//KandoFaida
const faidaConfig = {
  apiKey: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_FAIDA_PUBLIC_FIREBASE_APP_ID
};

const faidaApp = initializeApp(faidaConfig, "KandoFaida");
export const faidaDb = getDatabase(faidaApp);