const { contextBridge, ipcRenderer } = require('electron');

// 确保所有API都正确注册
contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (imageData, fileName) => ipcRenderer.invoke('save-image', imageData, fileName),
  saveImages: (imagesData) => ipcRenderer.invoke('save-images', imagesData),
  getAppImagesDir: () => ipcRenderer.invoke('get-app-images-dir'),
  clearDirectory: (dirPath) => ipcRenderer.invoke('clear-directory', dirPath),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  showFileInFolder: (filePath) => ipcRenderer.invoke('show-file-in-folder', filePath),
  // 添加开发者工具相关 API
  isDevToolsEnabled: () => ipcRenderer.invoke('isDevToolsEnabled'),
  toggleDevTools: (enabled) => ipcRenderer.invoke('toggleDevTools', enabled),
  // 添加数据导入导出相关 API
  exportData: (dbData) => ipcRenderer.invoke('exportData', dbData),
  importData: () => ipcRenderer.invoke('importData'),
}); 