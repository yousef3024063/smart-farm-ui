import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

console.log("🔥 Firebase Initializing with projectId:", firebaseConfig.projectId);

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log("✅ Firebase initialized successfully!");
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
  db = null;
}

export { db, ref, onValue, update };