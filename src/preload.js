const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateGameList: (callback) => ipcRenderer.on('update-gamelist', (_event, value) => callback(value)),
  onSetConfig: (callback) => ipcRenderer.on('set-config', (_event, value) => callback(value)),
  onSetSettings: (callback) => ipcRenderer.on('set-settings', (_event, value) => callback(value)),

  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  startGame: (gameId) => ipcRenderer.send('start-game', gameId)
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
