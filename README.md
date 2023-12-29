# SEGA Lindbergh loader GUI

This project is a proof-of-concept of a GUI for Lindbergh Loader (look here: https://github.com/bobbydilley/lindbergh-loader ).

The main purpose is to provide a nice GUI at startup of the arcade PC, taking JVS and USB gamepad inputs, and allowing to startup a script.

# How to run or build ?

This is an Electron app with Electron Forge tooling. 
First clone the GIT repositories, then run "npm install".

Valid commands are:
* npm start
* npm run package
* npm run make

## How to run dev version ?

```bash
npm start
```

# How to build "production" app ?

You can refer to official documentation of Electron https://www.electronjs.org/docs/latest/development/build-instructions-gn
and official documentation of Electron Forge https://www.electronforge.io/

At first install these dependencies:
```bash
apt install dpkg fakeroot rpm zip
```

then:
```bash
npm run make
```

By default, only ZIP output is configured. You should find distributable packages in the "out/make/" folder.

If you want to build DEB or RPM packages, then enable (uncomment) them in forge.config.js file. Be patient, this can take few minutes.

# Configuration and command line parameters

The application rely on some external resources:
* a JSON file for parameters
* a JSON file to save settings
* a folder of media (images, videos)

The default path to the `parameters.json` file is `\lindbergh-loader-gui\parameters.json`. An example file is provided in the "default-config" folder.  
You can also set the path to the file using "--parametersFilePath=" in command line.

All other path are set in the `parameters.json` file. Have a look at default file.

You can use Electron command line parameters too: https://www.electronjs.org/docs/latest/api/command-line-switches 

## Parameters file format

This parameter file is a JSON configuration file used for managing settings and game description. It is structured into three main sections: `games`, `config`, and `defaultSettings`.

#### 1. `games` Object

This section contains a collection of game entries, where each entry is identified by a unique key (e.g., `"2spicy"`, `"abc"`). Each game entry is an object with the following properties:

- **`name`**: The display name of the game.
- **`logo`**: The file path to the game's logo image.
- **`background`**: The file path to the game's background image.
- **`video`**: The file path to the game's promotional or gameplay video.
- **`command`**: The command line that will be called when game is started.
- **`args`**: The command line arguments that will be called when game is started.
- **`category`**: The category or genre of the game (e.g., Shooting, Flight).
- **`infos`**: An object containing additional information about the game, typically including:
    - **`Genre`**: The genre of the game.
    - **`Year`**: The release year of the game.
    - **`Developer`**: The developer of the game.
    - **`Players`**: The number of players supported by the game.


You can add any information in the "infos" section.

#### 2. `config` Object

This section contains general configuration settings for the application:

- **`settingsFileAbsPath`**: The absolute path to the file that keeps settings. It must be writtable.
- **`inputDeadZone`**: A threshold value for gamepad input sensitivity.
- **`inputFastZone`**: A threshold value for gamepad input sensitivity, when you want to go faster.
- **`inputWait`**: The wait time (in milliseconds) for input debouncing or repeat delay.

Example Config Section:

```json
"config": {
  "settingsFileAbsPath": "/path/to/settings.json",
  "inputDeadZone": 0.2,
  "inputFastZone": 0.9,
  "inputWait": 250
}
```

#### 3. `defaultSettings` Object

This section specifies default settings for the application when no setting file exists.

- **`lastGame`**: The identifier of the last game played. If it's empty then the first game in the list will be shown.
- **`autostart`**: A flag indicating whether the game should autostart (0 for no, 1 for yes).
- **`ratio`**: The aspect ratio setting for the game display (e.g., 43 for 4:3).
- **`autostartwait`**: The wait time in seconds before the game autostarts.


# Dependencies

The project rely on some other libraries like Electron, jQuery and Flipster.
* https://www.electronjs.org/
* https://jquery.com/
* https://github.com/drien/jquery-flipster* 
* (too) many modules in node_modules