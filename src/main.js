const { app, BrowserWindow, Menu, ipcMain } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const { spawn, exec } = require('node:child_process');

let win; // Global ref for future usages

const commandLineArgs = interpretCommandLineArgs();

const parameters = (commandLineArgs.parametersFilePath)  ?
    loadParameters(commandLineArgs.parametersFilePath) :
    loadParameters(path.join("/lindbergh-loader-gui", 'parameters.json'));


const createWindow = () => {
  try {
    // Create a new BrowserWindow instance
    win = new BrowserWindow({
      width: 1024,
      height: 768,
      menuBarVisible: false,
      fullscreen: false, // App will go fullscree when packaged
      kiosk: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false, // Security best practice
        contextIsolation: true, // Security best practice
        devTools: true
      }
    });

    // Open DevTools for debugging
    // win.webContents.openDevTools();

    win.webContents.on('did-finish-load', () => {
      // Ensure parameters are defined before sending
      if (parameters && parameters.games && parameters.config) {
        win.webContents.send('update-gamelist', parameters.games);
        win.webContents.send('set-config', parameters.config);
      }

      // Load the settings
      loadObjectFromFile(parameters.config.settingsFileAbsPath)
          .then(obj => win.webContents.send('set-settings', obj))
          .catch(err => {
            console.error('Error loading settings savefile:', err);
            settings = parameters.defaultSettings;
            win.webContents.send('set-settings', settings)
          });
    });

    ipcMain.on('save-settings', (event, settings) => {
      saveObjectToFile(settings, parameters.config.settingsFileAbsPath)
          .then(() => console.log('Settings saved successfully.'))
          .catch(err => console.error('Error saving settings:', err));
    })

    ipcMain.on('start-game', (event, gameId) => {
      console.log('Starting game %s', gameId)
      console.log( parameters.games[gameId].command, parameters.games[gameId].args)
      spawn(parameters.games[gameId].command, parameters.games[gameId].args, { detached: true });
      app.exit(0)
    })

    // Load the index.html of the app
    win.loadFile('src/index.html');

    // Handle window closed
    win.on('closed', () => {
      win = null; // Dereference the window object
    });
  } catch (error) {
    console.error('Error creating window:', error);
    // Handle the error appropriately
  }
};

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    // Switch to full screen when app is packaged
    if (app.isPackaged) {
      win.setFullScreen(true);
    }
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})



function saveObjectToFile(obj, filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath || typeof filePath !== 'string') {
      reject(new Error('Invalid file path'));
      return;
    }

    const jsonData = JSON.stringify(obj, null, 2);
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function loadObjectFromFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath || typeof filePath !== 'string') {
      reject(new Error('Invalid file path'));
      return;
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const obj = JSON.parse(data);
          resolve(obj);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
}

function loadParameters(parameterPath) {
  try {
    // Check if the file exists before attempting to read
    if (!fs.existsSync(parameterPath)) {
      console.error('Parameter file not found:', parameterPath);
      // Return default parameters or throw an error, as per your application's requirement
      app.exit(1)
      return {}; // Example: returning an empty object
    }

    const data = fs.readFileSync(parameterPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading parameters:', error);
    app.exit(1)
    return {};
  }
}
function interpretCommandLineArgs() {
  const argv = process.argv;

  // Skip the first two elements (node path and script path)
  const args = argv.slice(2);

  // Create an object to store the parsed arguments
  let parsedArgs = {};

  args.forEach(arg => {
    // Split each argument into key-value pairs
    if (arg.includes('=')) {
      let [key, value] = arg.split('=');
      // Remove any leading dashes from the key
      key = key.replace(/^-+/, '');
      parsedArgs[key] = value;
    } else {
      // For flags without explicit values, set their value to true
      const key = arg.replace(/^-+/, '');
      parsedArgs[key] = true;
    }
  });

  // Return the parsed arguments
  return parsedArgs;
}