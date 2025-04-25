const { contextBridge, ipcRenderer } = require('electron');

// 确保所有API都正确注册
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-video'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (imageData, fileName) => ipcRenderer.invoke('save-image', imageData, fileName),
  getAppImagesDir: () => ipcRenderer.invoke('get-app-images-dir')
}); 