// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD72jfLDMbs1kP3QhxR49bcWE80qj9COc",
  authDomain: "ai-draw-c2807.firebaseapp.com",
  projectId: "ai-draw-c2807",
  storageBucket: "ai-draw-c2807.firebasestorage.app",
  messagingSenderId: "357135848223",
  appId: "1:357135848223:web:7930d2fd0917b83d0c162a",
  measurementId: "G-TFSLTX56RH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);