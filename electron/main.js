const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// 判断是否是开发环境
const isDev = !app.isPackaged;

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // 开发环境可以关闭 webSecurity，但生产环境必须开启
      webSecurity: !isDev
    }
  });

  // 开发环境下打开开发者工具
  if (isDev) {
    win.webContents.openDevTools();
  }

  // 加载应用（开发环境加载 Vite 服务，生产环境加载打包后的静态文件）
  if (isDev) {
    // 开发环境：直接加载 Vite 服务
    console.log('开发环境：加载 Vite 服务...');
    win.loadURL('http://localhost:5173');
  } else {
    // 生产环境：加载打包后的 index.html
    console.log('生产环境：加载静态文件...');
    const indexPath = path.join(__dirname, '../dist/index.html');
    
    // 确认文件存在
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error('错误：找不到打包后的 index.html 文件！');
      win.loadFile(path.join(__dirname, 'error.html'));
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
