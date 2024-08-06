// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwX1F_eUAuMJtxykaSV-h3CeuMqkXuofs",
    authDomain: "name-list-8296b.firebaseapp.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Export the auth instance and functions
export { auth };