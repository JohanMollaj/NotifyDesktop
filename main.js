const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let loginWindow;
let userData = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Check if user is already logged in
  if (userData) {
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      // Send user data to renderer
      mainWindow.webContents.send('user-data', userData);
    });
  } else {
    createLoginWindow();
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

const createLoginWindow = () => {
  // Create the login window
  loginWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: false,
  });

  // Load the login.html file
  loginWindow.loadFile(path.join(__dirname, 'login.html'));

  // Hide the main window until login is successful
  if (mainWindow) mainWindow.hide();

  // Handle window closing
  loginWindow.on('closed', () => {
    loginWindow = null;
    // If user closed the login window without logging in, quit the app
    if (!userData && mainWindow && !mainWindow.isVisible()) {
      app.quit();
    }
  });

  // Open DevTools for debugging
  // loginWindow.webContents.openDevTools();
};

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create a window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed on non-macOS platforms
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for auth events
ipcMain.on('user-authenticated', (event, user) => {
  // Store user data in memory
  userData = user;
  
  // Show main window and close login window
  if (mainWindow) {
    mainWindow.show();
    mainWindow.webContents.send('user-data', user);
  }
  
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
});

ipcMain.on('logout', () => {
  // Clear stored user data
  userData = null;
  
  // Show login window and hide main window
  createLoginWindow();
  
  if (mainWindow) {
    mainWindow.hide();
  }
});