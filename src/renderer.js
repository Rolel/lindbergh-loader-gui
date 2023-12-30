let gameList = {};
let config = {};
let settings = {};
let selector;
let inputWait = false;
let inputStop = false;
let pauseAutostart = false;


window.onload = () => {
      setInterval(scanGamepad, 50);
      jQuery("#selector").on("click",".flipster__item--current", function() {
            startGame(jQuery( this ).data("loaderGameId"));
      })

      jQuery("body").on("click","a[href='#settings']", function() {
            toggleSettings();
      })
}

window.electronAPI.onSetConfig((value) => {
      config = value;
});
window.electronAPI.onSetSettings((value) => {
      settings = value;

      // Check if the lastgame is a valid game (first run, or game list change)
      if (settings.lastGame === undefined || !(settings.lastGame in gameList))  {
            settings.lastGame = Object.keys(gameList)[0];
      };

      // Start the autostart countdown
      if (Number(settings['autostart']) == 1) { autostart(settings['autostartwait'], settings.lastGame); }

      // Apply settings to setting popup
      applySettings(settings)

      // Activate the last game
      activateGame(settings.lastGame)
});

function applySettings(settings) {
      jQuery("#settings fieldset input")
          .each(function () {
                this.checked = false;
                if (settings[this.name] && settings[this.name] == jQuery(this).data('checkedValue')) {
                      this.checked = true;
                }
          });
      if (settings['ratio'] == '169') { jQuery("#screen").addClass('ratio169') }
      if (settings['ratio'] == '43') { jQuery("#screen").removeClass('ratio169') }

      jQuery(".autostart-infos").removeClass('autostart-paused autostart-enabled');
      if (Number(settings['autostart']) == 1) {
            jQuery(".autostart-infos").addClass('autostart-enabled');
            if (pauseAutostart) {
                  jQuery(".autostart-infos").addClass('autostart-paused');
            }
      }
}


/**
 * Activates a specific game in the game selector.
 * This function is used to highlight and display a particular game based on its ID.
 * It is typically called when updating the UI to reflect a game selection or change.
 *
 * @param {string} gameId - The unique identifier for the game to be activated.
 *                          This ID corresponds to the 'data-loader-game-id' attribute of the game items in the DOM.
 *
 * The function performs the following operations:
 * 1. Finds the game element in the DOM using the provided `gameId`.
 * 2. If the game element is found (i.e., it exists in the DOM), it performs two main actions:
 *    a. Uses the Flipster jQuery plugin to 'jump' to the game item, making it the current active item in the UI.
 *    b. Calls the `displayGame` function to update the UI with details of the selected game.
 *
 * Note: If the game with the specified `gameId` is not found, the function does nothing.
 */
function activateGame(gameId) {
      let game = jQuery('.item[data-loader-game-id="' + gameId + '"]');
      if (game.length > 0) {
            selector.flipster('jump', game);
            //
            displayGame(gameId);
      }
}

/**
 * Handles the event triggered when the game list is updated.
 * This function is called when the 'onUpdateGameList' event is emitted by the Electron API.
 * It updates the game list, generates HTML for each game item, and initializes the Flipster UI component.
 *
 * @param {Object} value - The updated game list. It's an object where each key is a unique identifier for a game,
 *                         and each value is an object containing game details (like category, name, and logo).
 *                         For example: { 'game1': { 'category': 'fighting', 'name': 'Game One', 'logo': 'path/to/logo1.png' }, ... }
 *
 * The function performs the following steps:
 * 1. Updates the global `gameList` with the new values.
 * 2. Creates HTML strings for each game item and inserts them into the DOM.
 * 3. Initializes or updates the Flipster jQuery plugin on the '#selector' element with the new game items.
 * 4. Activates the last selected game from the settings.
 */
window.electronAPI.onUpdateGameList((value) => {
      gameList = value;
      let itemsHtml = Object.entries(value).map(([key, game]) => `
        <div class="item" data-loader-game-id="${key}" data-flip-category="${game.category}" data-flip-title="${game.name}">
            <div class="game"><img src="${game.logo}" /></div>
        </div>
        `).join('');

      jQuery('#selector .container').html(itemsHtml);

      // https://github.com/drien/jquery-flipster
      selector = jQuery('#selector').flipster({
            itemContainer: '.container', // [string|object] // Selector for the container of the flippin' items.
            itemSelector: '.item', // [string|object]  // Selector for children of `itemContainer` to flip
            start: 'center', // ['center'|number] // Zero based index of the starting item, or use 'center' to start in the middle
            fadeIn: 400, // [milliseconds] // Speed of the fade in animation after items have been setup
            loop: false, // [true|false] // Loop around when the start or end is reached
            autoplay: false, // [false|milliseconds] // If a positive number, Flipster will automatically advance to next item after that number of milliseconds
            pauseOnHover: true, // [true|false] // If true, autoplay advancement will pause when Flipster is hovered
            style: 'coverflow', // [coverflow|carousel|flat|...] // Adds a class (e.g. flipster--coverflow) to the flipster element to switch between display styles  // Create your own theme in CSS and use this setting to have Flipster add the custom class
            spacing: -0.45,
            click: false,
            keyboard: false,
            scrollwheel: false,
            touch: false,
            nav: false,
            buttons: true,
            buttonPrev: 'Prev',
            buttonNext: 'Next',
            onItemSwitch: gameChanged
      });

      activateGame(settings.lastGame)
})

window.addEventListener('gamepadconnected', ({ gamepad }) => {
      console.log(
          "Gamepad connected at index %d: %s. %d buttons, %d axes.",
          gamepad.index,
          gamepad.id,
          gamepad.buttons.length,
          gamepad.axes.length,
          gamepad);
})

/**
 * Scans for gamepad input and handles the interaction within the application.
 * This function checks for input from connected gamepads and performs actions based on the input.
 * It's designed to work with a game selector UI and settings panel.
 *
 * The function performs the following operations:
 * 1. Retrieves the current state of all connected gamepads.
 * 2. Checks if the settings panel is open or if any input-related flags (inputWait, inputStop) are set.
 * 3. Iterates over each connected gamepad and processes their input:
 *    a. If settings are not open and flags are not set:
 *       - Handles navigation (left/right) through the game selector using gamepad axes.
 *       - Initiates game start or opens settings based on button presses.
 *    b. If settings are open and flags are not set:
 *       - Allows navigation through settings fields.
 *       - Toggles settings or saves and exits settings on button presses.
 *
 * Notes:
 * - The function uses jQuery to interact with the DOM.
 * - 'selector' is assumed to be a global variable referencing the game selector UI component.
 * - 'config' is assumed to be an object containing configuration options like 'inputDeadZone'.
 */
function scanGamepad () {
      let gamepads = navigator.getGamepads()
      let settingsOpen = (jQuery("#settings:visible").length > 0);

      Array.from(gamepads).forEach(gamepad => {
            if (!settingsOpen && !inputWait && !inputStop && gamepad) {
                  // console.log(gamepad.axes, gamepad.buttons)
                  if (gamepad.axes[0] > config.inputDeadZone) {
                        inputWaitStart();
                        pauseAutoStart();
                        selector.flipster('prev');
                        console.log('go right')
                        if (gamepad.axes[0] > config.inputFastZone) {
                              selector.flipster('prev').flipster('prev');
                              console.log('go more right')
                        }
                  }
                  if (gamepad.axes[0] < (-1 * config.inputDeadZone)) {
                        inputWaitStart();
                        pauseAutoStart();
                        selector.flipster('next');
                        console.log('go left')
                        if (gamepad.axes[0] < (-1 * config.inputFastZone)) {
                              selector.flipster('next').flipster('next');
                              console.log('go more left')
                        }
                  }

                  if (gamepad.buttons[0].pressed) {
                        inputWaitStart();
                        pauseAutoStart();
                        startGame(jQuery("#selector .flipster__item--current").data("loaderGameId"));
                  }
                  if (gamepad.buttons[1].pressed) {
                        inputWaitStart();
                        pauseAutoStart();
                        toggleSettings();
                  }
                  if (gamepad.buttons[2].pressed) { console.log('button C pressed') }
                  if (gamepad.buttons[3].pressed) { console.log('button D pressed') }
            }

            if (settingsOpen && !inputWait && !inputStop && gamepad) {
                  if (gamepad.axes[0] > config.inputDeadZone
                      || gamepad.axes[1] > config.inputDeadZone) {
                        inputWaitStart();
                        let all = jQuery("#settings fieldset");
                        let first = all[0];
                        let active = all.filter(".active");
                        let next = active.next('fieldset');
                        jQuery(active).removeClass("active");
                        if (next.length > 0) { jQuery(next).addClass("active");
                        } else { jQuery(first).addClass("active"); }
                  }
                  if (gamepad.axes[0] < (-1 * config.inputDeadZone)
                      || gamepad.axes[1] < (-1 * config.inputDeadZone)) {
                        inputWaitStart();
                        let all = jQuery("#settings fieldset");
                        let last = all.last();
                        let active = all.filter(".active");
                        let prev = active.prev('fieldset');
                        jQuery(active).removeClass("active");
                        if (prev.length > 0) { jQuery(prev).addClass("active");
                        } else { jQuery(last).addClass("active"); }
                  }

                  if (gamepad.buttons[0].pressed) {
                        inputWaitStart();

                        let all = jQuery("#settings fieldset.active input");
                        let first = all[0];
                        let active = all.filter("input:checked");
                        let next = active.nextAll('input:eq(0)');
                        if (all.length == 1) {
                              first.checked = !first.checked;
                        } else {
                              jQuery(all).each(function() { this.checked = false; });
                              if (next.length > 0) {
                                    jQuery(next).each(function() { this.checked = true; });
                              } else {
                                    jQuery(first).each(function() { this.checked = true; });
                              }
                        }


                  }
                  if (gamepad.buttons[1].pressed) {
                        inputWaitStart();
                        saveSettings();
                        toggleSettings();
                  }
            }

      })
}

function saveSettings() {
      jQuery("#settings fieldset input")
          .each(function () {
                if (this.checked && jQuery(this).data('checkedValue') != undefined) {
                      settings[this.name] = jQuery(this).data('checkedValue');
                }
                if (!this.checked && jQuery(this).data('uncheckedValue') != undefined) {
                      settings[this.name] = jQuery(this).data('uncheckedValue');
                }
          });
      applySettings(settings)
      window.electronAPI.saveSettings(settings);
}

function inputWaitStart() {
      inputWait = true;
      setTimeout(function() {
            inputWait = false;
      }, config.inputWait);
}

function gameChanged(currentItem, previousItem) {
      let gameId = jQuery(currentItem).data('loaderGameId');
      displayGame(gameId);
}

function displayGame(gameId) {
      // Inject video
      let videoPlayer = "<video autoplay loop muted width=\"100%\" height=\"100%\">\n" +
          "<source src=\"" + gameList[gameId].video + "\" type=\"video/mp4\"></video>"
      jQuery('#preview').html(videoPlayer);

      // Set background
      jQuery('#screen').css("background", "url(\"" + gameList[gameId].background + "\")");

      // Set gameinfos
      jQuery('#gameinstructions .infos li').remove();
      Object.entries(gameList[gameId]["infos"]).forEach(([key, value]) => {
            let item = "<li><span>" + key + "</span>" + value + "</li>";
            jQuery('#gameinstructions .infos').append(item);
      })

      // Set game name
      jQuery('.gamename').text(gameList[gameId].name);
}

function startGame(gameId) {
      console.log('Starting game ' + gameId);
      inputStop = true;
      settings.lastGame = gameId;
      window.electronAPI.saveSettings(settings);
      window.electronAPI.startGame(gameId);
}

function autostart(second, gameId) {
      if (!pauseAutostart) {
            if (second == 0) {
                  startGame(gameId)
            } else {
                  jQuery('.autostart-value').text(second);
                  setTimeout(autostart, 1000, (second - 1), gameId);
            }
      }
}

function pauseAutoStart() {
      // We redraw settings panel if autostart get paused
      if (!pauseAutostart) {
            pauseAutostart = true;
            applySettings(settings);
      }
}

function toggleSettings() {
      pauseAutoStart();
      jQuery("#settings").fadeToggle();
}