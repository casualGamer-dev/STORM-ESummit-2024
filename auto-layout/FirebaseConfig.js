import { initializeApp } from "firebase/app"
import { initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCD72jfLDMbs1kP3QhxR49bcWE80qj9COc",
  
    authDomain: "ai-draw-c2807.firebaseapp.com",
    projectId: "ai-draw-c2807",
    storageBucket: "ai-draw-c2807.firebasestorage.app",
    messagingSenderId: "357135848223",
    appId: "1:357135848223:web:7930d2fd0917b83d0c162a",
    measurementId: "G-TFSLTX56RH"
};


export const app = initializeApp(firebaseConfig, {})
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})
