// firebase.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyD6WlkV6PwkVd9NBhkE9x1tFcbay0Wzvxc",
  authDomain: "kandolipa-e4ea4.firebaseapp.com",
  //databaseURL: "https://kandolipa-default-rtdb.firebaseio.com",
  projectId: "kandolipa-e4ea4",
  storageBucket: "kandolipa-e4ea4.firebasestorage.app",
  messagingSenderId: "230552628071",
  appId: "1:230552628071:web:445476dc558f79106b5dc2"
};

const app = initializeApp(firebaseConfig);
//export const database = getDatabase(app);
