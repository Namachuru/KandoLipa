// firebase.js

import auth from "@react-native-firebase/auth";
import database from "@react-native-firebase/database";
import functions from "@react-native-firebase/functions";


// Default Firebase app = KandoLipa
export const lipaDb = database();

export const lipaFunctions = functions();


// KandoFaida secondary database

export const faidaDb = database(
  undefined,
  "https://kandofaida-18662-default-rtdb.firebaseio.com/"
);


// Auth
export { auth };