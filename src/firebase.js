import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwX1F_eUAuMJtxykaSV-h3CeuMqkXuofs"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Database
const auth = getAuth(app);

// Export the auth instance
export { auth };