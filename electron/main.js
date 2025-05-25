const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
const extract = require('extract-zip');
const httpServer = require('./http-server');
const { exec } = require('child_process');

// 判断是否是开发环境
const isDev = !app.isPackaged;

// 保存主窗口引用
let mainWindow = null;

// 添加日志
console.log('App starting...');
console.log('Is Dev:', isDev);
console.log('App path:', app.getAppPath());
console.log('User Data path:', app.getPath('userData'));

// 应用的图片缓存目录
const getImagesDir = () => {
  const userDataPath = app.getPath('userData');
  const imagesDir = path.join(userDataPath, 'images');
  // 确保目录存在
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  return imagesDir;
};

function createWindow () {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
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
    mainWindow.webContents.openDevTools();
  } else {
    // 在生产环境中也打开开发者工具以便调试
    // mainWindow.webContents.openDevTools();
  }

  // 加载应用
  if (isDev) {
    console.log('Loading development URL...');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production path:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('错误：找不到打包后的 index.html 文件！');
      console.log('Current directory:', __dirname);
      console.log('Available files in dist:', fs.existsSync(path.join(__dirname, '../dist')) ? 
        fs.readdirSync(path.join(__dirname, '../dist')) : 'dist directory not found');
      mainWindow.loadFile(path.join(__dirname, 'error.html'));
    }
  }

  // 监听加载错误
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

  return mainWindow;
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

// 开发者工具控制
let devToolsEnabled = isDev; // 开发环境下默认启用

ipcMain.handle('isDevToolsEnabled', () => {
  return devToolsEnabled;
});

ipcMain.handle('toggleDevTools', (_, enabled) => {
  try {
    devToolsEnabled = enabled;
    if (enabled) {
      mainWindow?.webContents.openDevTools();
    } else {
      mainWindow?.webContents.closeDevTools();
    }
    return true;
  } catch (error) {
    console.error('切换开发者工具失败:', error);
    return false;
  }
});

// 数据导入导出相关处理
ipcMain.handle('exportData', async (event, dbData) => {
  try {
    const result = await dialog.showSaveDialog({
      title: '导出数据',
      defaultPath: 'backup.vmd',
      filters: [{ name: '视频管理器数据', extensions: ['vmd'] }]
    });

    if (result.canceled) {
      return { success: false, message: '操作已取消' };
    }

    const backupPath = result.filePath;
    const imagesDir = getImagesDir();
    
    // 创建临时目录
    const tempDir = path.join(app.getPath('temp'), 'vmd-backup-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // 保存数据库数据
    fs.writeFileSync(path.join(tempDir, 'db.json'), dbData);
    
    // 复制图片文件
    const imagesBackupDir = path.join(tempDir, 'images');
    fs.mkdirSync(imagesBackupDir, { recursive: true });
    if (fs.existsSync(imagesDir)) {
      fs.cpSync(imagesDir, imagesBackupDir, { recursive: true });
    }
    
    // 创建压缩文件
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      // 清理临时目录
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
    
    archive.pipe(output);
    archive.directory(tempDir, false);
    await archive.finalize();
    
    return { success: true };
  } catch (error) {
    console.error('导出数据失败:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('importData', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: '导入数据',
      filters: [{ name: '视频管理器数据', extensions: ['vmd'] }],
      properties: ['openFile']
    });

    if (result.canceled) {
      return { success: false, message: '操作已取消' };
    }

    const backupPath = result.filePaths[0];
    const tempDir = path.join(app.getPath('temp'), 'vmd-restore-' + Date.now());
    
    // 解压文件
    await extract(backupPath, { dir: tempDir });
    
    // 读取数据库数据
    const dbData = fs.readFileSync(path.join(tempDir, 'db.json'), 'utf-8');
    
    // 替换图片目录
    const imagesDir = getImagesDir();
    const imagesBackupDir = path.join(tempDir, 'images');
    if (fs.existsSync(imagesDir)) {
      fs.rmSync(imagesDir, { recursive: true, force: true });
    }
    if (fs.existsSync(imagesBackupDir)) {
      fs.cpSync(imagesBackupDir, imagesDir, { recursive: true });
    }
    
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return { success: true, dbData };
  } catch (error) {
    console.error('导入数据失败:', error);
    return { success: false, message: error.message };
  }
});

// 添加打开文件夹的处理函数
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error('打开文件夹失败:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
});

// 添加打开并选中文件的处理函数
ipcMain.handle('show-file-in-folder', async (event, filePath) => {
  try {
    await shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error('打开文件所在文件夹失败:', error);
    return { 
      success: false, 
      message: error.message 
    };
  }
});

// 配置 HTTP 服务器
ipcMain.handle('configure-http-server', async (event, options) => {
  return httpServer.configure(options);
});

// 启动 HTTP 服务器
ipcMain.handle('start-http-server', async () => {
  return await httpServer.start();
});

// 停止 HTTP 服务器
ipcMain.handle('stop-http-server', async () => {
  return await httpServer.stop();
});

// 添加命令执行功能，用于调试
ipcMain.handle('execute-command', async (event, command) => {
  try {
    console.log(`[命令] 执行: ${command}`);
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[命令] 执行错误: ${error.message}`);
          resolve({ success: false, error: error.message, stderr, command });
        } else {
          console.log(`[命令] 输出: ${stdout}`);
          resolve({ success: true, stdout, stderr, command });
        }
      });
    });
  } catch (error) {
    console.error(`[命令] 异常: ${error.message}`);
    return { success: false, error: error.message, command };
  }
});

// 在应用关闭时清理资源
app.on('will-quit', () => {
  httpServer.stop();
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
