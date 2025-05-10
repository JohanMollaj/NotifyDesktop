// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Authentication
  sendAuthData: (userData) => ipcRenderer.send('user-authenticated', userData),
  logoutUser: () => ipcRenderer.send('logout'),
  onUserData: (callback) => ipcRenderer.on('user-data', (_, user) => callback(user)),
  
  // Window management
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // System theme
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onThemeChanged: (callback) => ipcRenderer.on('theme-changed', (_, theme) => callback(theme))
});