import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkOFEE3zHO5iZJuXeRy4Cxp7eBoREOw84",
  authDomain: "alex-lexington-studio.firebaseapp.com",
  projectId: "alex-lexington-studio",
  storageBucket: "alex-lexington-studio.firebasestorage.app",
  messagingSenderId: "273477780908",
  appId: "1:273477780908:web:2083ed89f427c9b5a46609"
};

// Initialize Firebase
// Use legacy initialization to match environment types
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const analytics = typeof window !== 'undefined' ? firebase.analytics() : null;

// Set persistence to LOCAL to prevent logout on refresh
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
  console.error("Auth Persistence Error:", error);
});

// Configure Google Provider
export const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;