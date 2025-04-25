const { contextBridge, ipcRenderer } = require('electron');

// 确保所有API都正确注册
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectVideo: () => ipcRenderer.invoke('select-video'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (imageData) => ipcRenderer.invoke('save-image', imageData),
  getAppImagesDir: () => ipcRenderer.invoke('get-app-images-dir'),
  clearDirectory: (dirPath) => ipcRenderer.invoke('clear-directory', dirPath)
}); 