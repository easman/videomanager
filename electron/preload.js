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
  
  // USB 多路复用和 HTTP 服务相关 API
  checkIproxyInstallation: () => ipcRenderer.invoke('check-iproxy-installation'),
  checkIPhoneConnection: () => ipcRenderer.invoke('check-iphone-connection'),
  startUsbForwarding: () => ipcRenderer.invoke('start-usb-forwarding'),
  stopUsbForwarding: () => ipcRenderer.invoke('stop-usb-forwarding'),
  getUsbServiceStatus: () => ipcRenderer.invoke('get-usb-service-status'),
  configureUsbForwarding: (options) => ipcRenderer.invoke('configure-usb-forwarding', options),
  configureHttpServer: (options) => ipcRenderer.invoke('configure-http-server', options),
  startHttpServer: () => ipcRenderer.invoke('start-http-server'),
  stopHttpServer: () => ipcRenderer.invoke('stop-http-server'),
  getHttpServerInfo: () => ipcRenderer.invoke('get-http-server-info'),
  
  // 诊断工具
  diagnoseConnection: () => ipcRenderer.invoke('diagnose-connection'),
  
  // 命令执行
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
  
  // 直接启动 iproxy
  startIproxyWithParams: (devicePort, hostPort) => 
    ipcRenderer.invoke('start-iproxy-with-params', devicePort, hostPort),
}); 