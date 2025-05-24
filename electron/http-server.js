const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { app } = require('electron');
const usbMuxService = require('./usbmux-service');

class HttpServer {
  constructor() {
    this._app = express();
    this._server = null;
    this._port = 3000;
    this._uploadDir = '';
    this._configured = false;
  }

  // 配置服务器
  configure(options = {}) {
    // 设置端口和上传目录
    this._port = options.port || 3000;
    this._uploadDir = options.uploadDir || path.join(app.getPath('userData'), 'uploads');
    
    // 确保上传目录存在
    if (!fs.existsSync(this._uploadDir)) {
      fs.mkdirSync(this._uploadDir, { recursive: true });
    }

    // 配置存储
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this._uploadDir);
      },
      filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

    // 配置文件过滤器
    const fileFilter = (req, file, cb) => {
      // 接受视频文件
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('仅支持上传视频文件'), false);
      }
    };

    // 配置上传中间件
    const upload = multer({ 
      storage, 
      fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 限制为5GB
      }
    });

    // 使用中间件
    this._app.use(cors());
    this._app.use(express.json());
    this._app.use(express.urlencoded({ extended: true }));
    this._app.use(express.static(path.join(__dirname, 'public')));
    
    // 添加错误处理中间件
    this._app.use((err, req, res, next) => {
      console.error('[HTTP] 请求处理错误:', err);
      res.status(500).json({ 
        success: false, 
        message: '服务器错误: ' + err.message 
      });
    });

    // 添加一个简单的测试页面
    this._app.get('/test', (req, res) => {
      res.send('连接成功！服务器工作正常。');
    });

    // 上传文件路由
    this._app.post('/upload', upload.single('video'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ success: false, message: '没有收到文件' });
      }
      
      return res.json({
        success: true,
        file: req.file,
        path: req.file.path
      });
    });

    // 状态检查路由
    this._app.get('/status', (req, res) => {
      res.json({
        status: 'running',
        port: this._port,
        uploadDir: this._uploadDir,
        timestamp: new Date().toISOString()
      });
    });

    // 添加一个简单的首页
    this._app.get('/', (req, res) => {
      const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>连接测试</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              max-width: 500px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 { color: #4CAF50; }
            .success { 
              background-color: #dff0d8; 
              color: #3c763d;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            button {
              background-color: #4CAF50;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-size: 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h1>连接成功！</h1>
          <div class="success">
            <p>🎉 恭喜！您已成功通过 USB 连接到服务器。</p>
            <p>服务器当前时间: ${new Date().toLocaleString()}</p>
            <p>服务器端口: ${this._port}</p>
          </div>
          <button onclick="testUpload()">测试上传功能</button>
          <div id="result"></div>

          <script>
            function testUpload() {
              const result = document.getElementById('result');
              result.innerHTML = '正在测试上传功能...';
              
              fetch('/status')
                .then(response => response.json())
                .then(data => {
                  result.innerHTML = '<p style="color: green">✅ 上传功能测试成功！</p><pre>' + 
                    JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                  result.innerHTML = '<p style="color: red">❌ 测试失败: ' + error.message + '</p>';
                });
            }
          </script>
        </body>
        </html>
      `;
      
      res.send(html);
    });

    this._configured = true;
    return { success: true };
  }

  // 启动服务器
  start() {
    if (this._server) {
      return { success: true, message: '服务器已经在运行', port: this._port };
    }

    if (!this._configured) {
      this.configure();
    }

    return new Promise((resolve) => {
      try {
        console.log(`[HTTP] 正在尝试启动 HTTP 服务器，端口: ${this._port}`);
        
        // 使服务器监听所有网络接口，而不仅仅是 localhost
        this._server = this._app.listen(this._port, '0.0.0.0', () => {
          console.log(`[HTTP] 服务器已启动，监听地址: 0.0.0.0:${this._port}`);
          console.log(`[HTTP] 上传目录: ${this._uploadDir}`);
          
          // 获取本机 IP 地址
          const networkInterfaces = require('os').networkInterfaces();
          const addresses = [];
          
          for (const interfaceName in networkInterfaces) {
            const interfaceInfo = networkInterfaces[interfaceName];
            for (const address of interfaceInfo) {
              if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
              }
            }
          }
          
          console.log(`[HTTP] 本机 IP 地址: ${addresses.join(', ') || '未找到'}`);
          console.log(`[HTTP] 本地访问地址: http://localhost:${this._port}`);
          console.log(`[HTTP] 网络访问地址: ${addresses.map(ip => `http://${ip}:${this._port}`).join(', ') || '无'}`);
          
          usbMuxService.setServerRunning(true);
          resolve({
            success: true,
            message: '服务器已启动',
            port: this._port,
            uploadDir: this._uploadDir,
            localUrl: `http://localhost:${this._port}`,
            networkUrls: addresses.map(ip => `http://${ip}:${this._port}`)
          });
        });
        
        this._server.on('error', (error) => {
          console.error('启动 HTTP 服务器失败:', error);
          this._server = null;
          usbMuxService.setServerRunning(false);
          resolve({
            success: false,
            message: `启动服务器失败: ${error.message}`
          });
        });
      } catch (error) {
        console.error('启动 HTTP 服务器时发生异常:', error);
        usbMuxService.setServerRunning(false);
        resolve({
          success: false,
          message: `启动服务器异常: ${error.message}`
        });
      }
    });
  }

  // 停止服务器
  stop() {
    return new Promise((resolve) => {
      if (!this._server) {
        resolve({ success: true, message: '服务器未运行' });
        return;
      }

      this._server.close((error) => {
        if (error) {
          console.error('停止 HTTP 服务器失败:', error);
          resolve({
            success: false,
            message: `停止服务器失败: ${error.message}`
          });
        } else {
          console.log('HTTP 服务器已停止');
          this._server = null;
          usbMuxService.setServerRunning(false);
          resolve({
            success: true,
            message: '服务器已停止'
          });
        }
      });
    });
  }

  // 获取服务器信息
  getInfo() {
    return {
      running: !!this._server,
      port: this._port,
      uploadDir: this._uploadDir
    };
  }
}

module.exports = new HttpServer(); 