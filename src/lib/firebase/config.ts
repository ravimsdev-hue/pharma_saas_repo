import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAGLceZkmTOh134jIYZGBNAqz77-1rxwfQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pharma-saas-app.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://pharma-saas-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pharma-saas-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pharma-saas-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "222263479923",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:222263479923:web:429e20045d6caf5ea86406",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-NQQ6EHN8FD",
};

let app: FirebaseApp;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let rtdb: Database | null = null;
let storage: FirebaseStorage | null = null;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (typeof window !== "undefined") {
    auth = getAuth(app);
    const databaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || "parmadb";
    try {
      firestore = getFirestore(app, databaseId);
    } catch {
      firestore = getFirestore(app);
    }
    rtdb = getDatabase(app, firebaseConfig.databaseURL);
    storage = getStorage(app);
  }
} catch (error) {
  console.warn("Firebase initialization warning:", error);
}

export { app, auth, firestore, rtdb, storage, firebaseConfig };
