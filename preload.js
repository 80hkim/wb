const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startSearchServer: () => ipcRenderer.invoke('start-search-server'),
  stopSearchServer: () => ipcRenderer.invoke('stop-search-server'),
  startTranslateServer: (apiKey) => ipcRenderer.invoke('start-translate-server', apiKey),
  stopTranslateServer: () => ipcRenderer.invoke('stop-translate-server'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onServerLog: (callback) => ipcRenderer.on('server-log', (event, data) => callback(data)),
  onServerStopped: (callback) => ipcRenderer.on('server-stopped', (event, server) => callback(server))
});