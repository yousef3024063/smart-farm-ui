import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";

// Your specific Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDXolRq3i7dGuXYtfzM4iF-QJD-JJ4Si0",
  authDomain: "smart-farm-30213.firebaseapp.com",
  databaseURL: "https://smart-farm-30213-default-rtdb.firebaseio.com",
  projectId: "smart-farm-30213",
  storageBucket: "smart-farm-30213.firebasestorage.app",
  messagingSenderId: "459244704750",
  appId: "1:459244704750:web:fd577bef214938e757b4ff",
  measurementId: "G-9WJX9WMQMX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, update };