// Firebase configuration for Notify Electron
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyDoEz15Ddry88J0xlg2ALWL_s_zG4razdE",
    authDomain: "notify-bef99.firebaseapp.com",
    projectId: "notify-bef99",
    storageBucket: "notify-bef99.firebasestorage.app",
    messagingSenderId: "706958256766",
    appId: "1:706958256766:web:873a6c3d85baefea46462f",
    measurementId: "G-50ZW4YCXZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

module.exports = { app, auth, db };