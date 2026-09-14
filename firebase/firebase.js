import {
  initializeApp,
  getApp,
  getApps,
} from "@react-native-firebase/app";

import {
  getAuth,
} from "@react-native-firebase/auth";

import {
  getDatabase,
} from "@react-native-firebase/database";

import {
  getFunctions,
} from "@react-native-firebase/functions";


// ============================================================
// KANDO LIPA — DEFAULT APP
// ============================================================

const lipaApp = getApp();

export const auth = getAuth(lipaApp);
export const lipaDb = getDatabase(lipaApp);
export const lipaFunctions = getFunctions(lipaApp);


// ============================================================
// KANDO FAIDA — SECONDARY APP
// ============================================================

const faidaConfig = {
  apiKey: "AIzaSyD-R_iObYF3n-seke0sOZR436HZ9NgBUDM",
  appId: "1:454996214392:android:badb4008e69f367997a38d",
  projectId: "kandofaida-18662",
  storageBucket: "kandofaida-18662.firebasestorage.app",
   messagingSenderId: "454996214392",
   databaseURL:
    "https://kandofaida-18662-default-rtdb.firebaseio.com"
};


// ============================================================
// GET / CREATE KANDO FAIDA APP
// ============================================================

let faidaApp = getApps().find(
  (app) => app.name === "KandoFaida"
);


// ============================================================
// IMPORTANT
// initializeApp() is ASYNC for secondary apps.
// ============================================================

export const faidaAppPromise =
  faidaApp
    ? Promise.resolve(faidaApp)
    : initializeApp(
        faidaConfig,
        "KandoFaida"
      );


// ============================================================
// DEBUG
// ============================================================

faidaAppPromise.then((app) => {
  console.log("==================================================");
  console.log("LIPA APP NAME:", lipaApp.name);
  console.log("FAIDA APP NAME:", app.name);
  console.log(
    "SAME APP:",
    lipaApp === app
  );

  console.log(
    "LIPA DATABASE URL:",
    lipaApp.options.databaseURL
  );

  console.log(
    "FAIDA DATABASE URL:",
    app.options.databaseURL
  );

  console.log("==================================================");
});


// ============================================================
// FAIDA DATABASE
// ============================================================
//
// IMPORTANT:
// Because faidaApp is initialized asynchronously,
// components should obtain faidaDb through
// getFaidaDb().
// ============================================================

export const getFaidaDb = async () => {
  const app = await faidaAppPromise;

  return getDatabase(app);
};
