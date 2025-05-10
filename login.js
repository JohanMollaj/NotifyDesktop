// login.js - simplified
const { loginUser, registerUser } = require('./auth-handler');
const { ipcRenderer } = require('electron');

// DOM Elements
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');

const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerConfirmPassword = document.getElementById('register-confirm-password');
const registerButton = document.getElementById('register-button');

const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');

// Check if user prefers dark theme
function checkThemePreference() {
    const storedTheme = localStorage.getItem('appTheme');
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingSpinner.style.display = 'none';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Show loading spinner
function showLoading() {
    loadingSpinner.style.display = 'block';
    hideError();
}

// Hide loading spinner
function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Switch between login and register tabs
function switchToLogin() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    hideError();
}

function switchToRegister() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    hideError();
}

// Handle login functionality
async function handleLogin() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    showLoading();
    
    const result = await loginUser(email, password);
    
    if (result.success) {
        const user = result.user;
        
        // Notify main process that user is authenticated
        ipcRenderer.send('user-authenticated', { 
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || ''
        });
        
        // Clear fields
        loginEmail.value = '';
        loginPassword.value = '';
    } else {
        showError('Login failed: ' + result.error);
    }
}

// Handle registration functionality
async function handleRegister() {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;

    if (!name || !email || !password || !confirmPassword) {
        showError('Please fill out all fields');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    showLoading();
    
    const result = await registerUser(email, password, name);
    
    if (result.success) {
        const user = result.user;
        
        // Notify main process that user is authenticated
        ipcRenderer.send('user-authenticated', { 
            uid: user.uid,
            email: user.email,
            displayName: name
        });
        
        // Clear fields
        registerName.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        registerConfirmPassword.value = '';
    } else {
        showError('Registration failed: ' + result.error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check for theme preference
    checkThemePreference();
    
    // Tab switching
    loginTab.addEventListener('click', switchToLogin);
    registerTab.addEventListener('click', switchToRegister);
    
    // Form submission
    loginButton.addEventListener('click', handleLogin);
    registerButton.addEventListener('click', handleRegister);
    
    // Enter key press in login form
    loginPassword.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Enter key press in register form
    registerConfirmPassword.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
});