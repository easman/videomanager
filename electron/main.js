const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
const extract = require('extract-zip');
const usbMuxService = require('./usbmux-service');
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

// 批量保存图片数据到应用缓存目录
ipcMain.handle('save-images', async (event, imagesData) => {
  try {
    const imagesDir = getImagesDir();
    const results = [];

    for (const { imageData, fileName } of imagesData) {
      try {
        // 从 data URL 提取数据
        const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          results.push({ success: false, message: '无效的图片数据格式' });
          continue;
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
        
        results.push({ 
          success: true, 
          path: filePath 
        });
      } catch (error) {
        results.push({ 
          success: false, 
          message: '保存图片失败: ' + error.message 
        });
      }
    }
    
    return { 
      success: true, 
      results 
    };
  } catch (error) {
    console.error('批量保存图片失败:', error);
    return { 
      success: false, 
      message: '批量保存图片失败: ' + error.message 
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

// 添加 USB 和 HTTP 服务相关的 IPC 处理函数

// 检查 iproxy 是否已安装
ipcMain.handle('check-iproxy-installation', async () => {
  const isInstalled = await usbMuxService.checkIproxyInstallation();
  return { success: true, isInstalled };
});

// 检查 iPhone 连接状态
ipcMain.handle('check-iphone-connection', async () => {
  const isConnected = await usbMuxService.checkIPhoneConnection();
  return { success: true, isConnected };
});

// 启动 USB 端口转发
ipcMain.handle('start-usb-forwarding', async () => {
  return await usbMuxService.startIproxy();
});

// 停止 USB 端口转发
ipcMain.handle('stop-usb-forwarding', async () => {
  return usbMuxService.stopIproxy();
});

// 获取 USB 服务状态
ipcMain.handle('get-usb-service-status', () => {
  return { success: true, status: usbMuxService.getStatus() };
});

// 配置 USB 端口转发
ipcMain.handle('configure-usb-forwarding', async (event, options) => {
  const hostPort = options?.hostPort || 3000;
  const devicePort = options?.devicePort || 3000;
  
  console.log(`[USB] 配置端口转发: 设备端口 ${devicePort} -> 主机端口 ${hostPort}`);
  
  // 配置 usbMuxService 使用相应的端口
  return usbMuxService.configurePorts(hostPort, devicePort);
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

// 获取 HTTP 服务器信息
ipcMain.handle('get-http-server-info', () => {
  return { success: true, info: httpServer.getInfo() };
});

// 添加诊断工具
ipcMain.handle('diagnose-connection', async () => {
  try {
    console.log('[诊断] 开始检查连接问题...');
    
    // 1. 检查 iproxy 是否安装
    const checkIproxy = await new Promise((resolve) => {
      exec('which iproxy', (error, stdout) => {
        if (error) {
          console.log('[诊断] iproxy 未安装');
          resolve({ success: false, message: 'iproxy 未安装，请运行 brew install usbmuxd' });
        } else {
          console.log('[诊断] iproxy 已安装: ' + stdout.trim());
          resolve({ success: true, path: stdout.trim() });
        }
      });
    });

    if (!checkIproxy.success) {
      return { success: false, steps: [checkIproxy] };
    }

    // 2. 检查 iPhone 连接
    const checkIPhone = await new Promise((resolve) => {
      exec('idevice_id -l', (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log('[诊断] 未检测到 iPhone 设备');
          resolve({ success: false, message: '未检测到 iPhone 设备' });
        } else {
          console.log('[诊断] 检测到设备: ' + stdout.trim());
          resolve({ success: true, devices: stdout.trim().split('\n') });
        }
      });
    });

    if (!checkIPhone.success) {
      return { success: false, steps: [checkIproxy, checkIPhone] };
    }

    // 3. 检查 iproxy 进程
    const checkIproxyProcess = await new Promise((resolve) => {
      exec('ps aux | grep iproxy | grep -v grep', (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log('[诊断] 未检测到 iproxy 进程运行');
          resolve({ success: false, message: 'iproxy 进程未运行' });
        } else {
          console.log('[诊断] iproxy 进程: \n' + stdout.trim());
          resolve({ success: true, processes: stdout.trim() });
        }
      });
    });

    // 4. 检查 HTTP 服务器端口
    const checkHttpPort = await new Promise((resolve) => {
      exec('lsof -i :' + httpServer._port, (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log('[诊断] 端口 ' + httpServer._port + ' 没有被监听');
          resolve({ success: false, message: 'HTTP 服务器端口未被监听' });
        } else {
          console.log('[诊断] 端口 ' + httpServer._port + ' 正在被监听: \n' + stdout.trim());
          
          // 检查是否有多个进程监听同一端口
          const processes = stdout.trim().split('\n');
          const listeningProcesses = processes.filter(line => line.includes('LISTEN'));
          
          if (listeningProcesses.length > 1) {
            console.log('[诊断] 检测到端口冲突！多个进程监听同一端口: ' + httpServer._port);
            resolve({ 
              success: false, 
              message: '检测到端口冲突！多个进程监听同一端口: ' + httpServer._port,
              portInfo: stdout.trim(),
              conflicting: true
            });
          } else {
            resolve({ success: true, portInfo: stdout.trim() });
          }
        }
      });
    });

    // 5. 尝试在本地访问 HTTP 服务
    const checkHttpService = await new Promise((resolve) => {
      const req = require('http').request({
        host: 'localhost',
        port: httpServer._port,
        path: '/status',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log('[诊断] HTTP 服务响应: ' + data);
          try {
            const response = JSON.parse(data);
            resolve({ success: true, response });
          } catch (e) {
            resolve({ success: true, response: data });
          }
        });
      });
      
      req.on('error', (error) => {
        console.log('[诊断] 本地 HTTP 请求失败: ' + error.message);
        resolve({ success: false, message: '无法连接到 HTTP 服务: ' + error.message });
      });
      
      req.end();
    });

    // 6. 检查 usbmuxd 守护进程
    const checkUsbmuxd = await new Promise((resolve) => {
      exec('ps aux | grep usbmuxd | grep -v grep', (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log('[诊断] 未检测到 usbmuxd 进程运行');
          resolve({ success: false, message: 'usbmuxd 进程未运行' });
        } else {
          console.log('[诊断] usbmuxd 进程: \n' + stdout.trim());
          resolve({ success: true, processes: stdout.trim() });
        }
      });
    });

    // 收集诊断结果
    const diagnostics = {
      success: checkIproxy.success && checkIPhone.success && checkHttpService.success,
      steps: [
        { name: 'iproxy_installation', ...checkIproxy },
        { name: 'iphone_connection', ...checkIPhone },
        { name: 'iproxy_process', ...checkIproxyProcess },
        { name: 'http_port', ...checkHttpPort },
        { name: 'http_service', ...checkHttpService },
        { name: 'usbmuxd_process', ...checkUsbmuxd }
      ],
      timestamp: new Date().toISOString()
    };

    console.log('[诊断] 完成，结果:', JSON.stringify(diagnostics, null, 2));
    return diagnostics;
  } catch (error) {
    console.error('[诊断] 发生错误:', error);
    return { success: false, error: error.message };
  }
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

// 直接使用指定参数启动 iproxy（用于手动调试）
ipcMain.handle('start-iproxy-with-params', async (event, devicePort, hostPort) => {
  console.log(`[IPC] 请求直接启动 iproxy，参数: ${devicePort} ${hostPort}`);
  return await usbMuxService.startIproxyWithParams(
    parseInt(devicePort) || 3000, 
    parseInt(hostPort) || 3000
  );
});

// 在应用关闭时清理资源
app.on('will-quit', () => {
  usbMuxService.cleanup();
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
