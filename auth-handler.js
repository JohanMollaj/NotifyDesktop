// auth-handler.js - Handles Firebase Authentication
const { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signOut 
} = require('firebase/auth');
const { auth } = require('./firebaseConfig');

// Login user
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Return user data in a format that can be stored
        return { 
            success: true, 
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || ''
            } 
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Register user
async function registerUser(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update the user's display name
        await updateProfile(user, { displayName });
        
        // Return user data in a format that can be stored
        return { 
            success: true, 
            user: {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                photoURL: user.photoURL || ''
            } 
        };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

// Logout user
async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Reset password
async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
    }
}

// Get current user
function getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || ''
        };
    }
    return null;
}

module.exports = { 
    loginUser, 
    registerUser, 
    logoutUser, 
    resetPassword,
    getCurrentUser
};