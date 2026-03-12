// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "mathmania-344ff.firebaseapp.com",
  projectId: "mathmania-344ff",
  storageBucket: "mathmania-344ff.firebasestorage.app",
  messagingSenderId: "682238169308",
  appId: "1:682238169308:web:878094f9a1ad4a8b2b6419",
  measurementId: "G-XGDQWR3CFB"
};

// Initialize Firebase (guarding against re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { app as firebaseApp };
