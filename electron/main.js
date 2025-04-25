const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 判断是否是开发环境
const isDev = !app.isPackaged;

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 开发环境下打开开发者工具
  if (isDev) {
    win.webContents.openDevTools();
  }

  // 加载应用
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error('错误：找不到打包后的 index.html 文件！');
      win.loadFile(path.join(__dirname, 'error.html'));
    }
  }

  return win;
}

// 处理选择文件夹
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
