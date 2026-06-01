// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

//KandoLipa
const lipaConfig = {
  apiKey: "AIzaSyD6WlkV6PwkVd9NBhkE9x1tFcbay0Wzvxc",
  authDomain: "kandolipa-e4ea4.firebaseapp.com",
  //databaseURL: "https://kandolipa-default-rtdb.firebaseio.com",
  projectId: "kandolipa-e4ea4",
  storageBucket: "kandolipa-e4ea4.firebasestorage.app",
  messagingSenderId: "230552628071",
  appId: "1:230552628071:web:445476dc558f79106b5dc2"
};

const lipaApp = initializeApp(lipaConfig);
//export const lipaDb = getDatabase(lipaApp);


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