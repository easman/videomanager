const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// 判断是否是开发环境
const isDev = !app.isPackaged;

// 添加日志
console.log('App starting...');
console.log('Is Dev:', isDev);
console.log('App path:', app.getAppPath());
console.log('User Data path:', app.getPath('userData'));

// 应用的图片缓存目录
const getImagesDir = () => {
  const userDataPath = app.getPath('userData');
  const imagesDir = path.join(userDataPath, 'images');
  console.log('getImagesDir imagesDir', imagesDir);
  // 确保目录存在
  if (!fs.existsSync(imagesDir)) {
    console.log('getImagesDir imagesDir', "ok");
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  return imagesDir;
};

function createWindow () {
  console.log('Creating window...');
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false  // 允许加载本地资源
    }
  });

  // 开发环境下打开开发者工具
  if (isDev) {
    win.webContents.openDevTools();
  } else {
    // 在生产环境中也打开开发者工具以便调试
    win.webContents.openDevTools();
  }

  // 加载应用
  if (isDev) {
    console.log('Loading development URL...');
    win.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production path:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      console.error('错误：找不到打包后的 index.html 文件！');
      console.log('Current directory:', __dirname);
      console.log('Available files in dist:', fs.existsSync(path.join(__dirname, '../dist')) ? 
        fs.readdirSync(path.join(__dirname, '../dist')) : 'dist directory not found');
      win.loadFile(path.join(__dirname, 'error.html'));
    }
  }

  // 监听加载错误
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

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

// 处理选择视频文件
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '视频文件', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// 处理选择图片文件
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// 保存图片数据到应用缓存目录
ipcMain.handle('save-image', async (event, imageData, fileName) => {
  try {
    const imagesDir = getImagesDir();
    
    // 从 data URL 提取数据
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, message: '无效的图片数据格式' };
    }
    
    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // 生成文件名（如果没有提供）
    let targetFileName = fileName;
    if (!targetFileName) {
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      const extension = type.split('/')[1] || 'png';
      targetFileName = `${hash}.${extension}`;
    }
    
    // 确保文件名有正确的扩展名
    if (!targetFileName.includes('.')) {
      const extension = type.split('/')[1] || 'png';
      targetFileName = `${targetFileName}.${extension}`;
    }
    
    const filePath = path.join(imagesDir, targetFileName);
    fs.writeFileSync(filePath, buffer);
    
    return { 
      success: true, 
      path: filePath 
    };
  } catch (error) {
    console.error('保存图片失败:', error);
    return { 
      success: false, 
      message: '保存图片失败: ' + error.message 
    };
  }
});

// 获取图片目录
ipcMain.handle('get-app-images-dir', () => {
  return getImagesDir();
});

// 清空目录
ipcMain.handle('clear-directory', async (event, dirPath) => {
  try {
    // 确保目录存在
    if (!fs.existsSync(dirPath)) {
      return { success: true, message: '目录不存在' };
    }

    // 读取目录中的所有文件
    const files = fs.readdirSync(dirPath);
    
    // 删除每个文件
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      fs.unlinkSync(filePath);
    }

    return { success: true };
  } catch (error) {
    console.error('清空目录失败:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
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
