const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class UsbMuxService {
  constructor() {
    this._iproxyProcess = null;
    this._serverProcess = null;
    this._isServerRunning = false;
    this._deviceConnected = false;
    this._hostPort = 3000;
    this._devicePort = 3000;
    this._statusCheckInterval = null;
  }

  // 检查 iproxy 是否已安装
  async checkIproxyInstallation() {
    return new Promise((resolve) => {
      exec('which iproxy', (error) => {
        if (error) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  // 检查 iPhone 是否已连接
  async checkIPhoneConnection() {
    return new Promise((resolve) => {
      // 首先尝试使用 idevice_id 命令检查连接的设备
      exec('idevice_id -l', (error, stdout) => {
        if (error || !stdout.trim()) {
          // 如果 idevice_id 失败，尝试其他方法
          console.log('[USB] idevice_id 检测失败，尝试使用 system_profiler');
          
          // 在 macOS 上尝试使用 system_profiler 检测 iOS 设备
          exec('system_profiler SPUSBDataType | grep -A 20 "iPhone" | grep "Serial Number"', (err2, stdout2) => {
            if (err2 || !stdout2.trim()) {
              console.log('[USB] 未检测到 iPhone 设备');
              this._deviceConnected = false;
              resolve(false);
            } else {
              console.log('[USB] 通过 system_profiler 检测到 iPhone 设备');
              this._deviceConnected = true;
              resolve(true);
            }
          });
        } else {
          console.log('[USB] 检测到 iPhone 设备:', stdout.trim());
          this._deviceConnected = true;
          resolve(true);
        }
      });
    });
  }

  // 启动 iproxy
  startIproxy() {
    if (this._iproxyProcess) {
      return { success: true, message: '端口转发已经在运行' };
    }

    return new Promise((resolve) => {
      console.log(`[USB] 启动 iproxy: 将设备端口 ${this._devicePort} 转发到主机端口 ${this._hostPort}`);
      
      // iproxy 命令格式为: iproxy 设备端口 主机端口
      this._iproxyProcess = spawn('iproxy', [`${this._devicePort}`, `${this._hostPort}`]);

      this._iproxyProcess.stdout.on('data', (data) => {
        console.log(`[USB] iproxy stdout: ${data}`);
      });

      this._iproxyProcess.stderr.on('data', (data) => {
        console.log(`[USB] iproxy stderr: ${data}`);
      });

      this._iproxyProcess.on('error', (error) => {
        console.error('[USB] 启动 iproxy 失败:', error);
        this._iproxyProcess = null;
        resolve({ success: false, message: `启动端口转发失败: ${error.message}` });
      });

      this._iproxyProcess.on('close', (code) => {
        console.log(`[USB] iproxy 进程退出，退出码: ${code}`);
        this._iproxyProcess = null;
      });

      // 给 iproxy 一点时间来启动
      setTimeout(() => {
        if (this._iproxyProcess) {
          console.log('[USB] iproxy 已成功启动');
          resolve({ success: true, message: '端口转发已启动' });
        } else {
          console.error('[USB] iproxy 启动失败，超时');
          resolve({ success: false, message: '端口转发启动失败' });
        }
      }, 500);
    });
  }

  // 停止 iproxy
  stopIproxy() {
    if (this._iproxyProcess) {
      this._iproxyProcess.kill();
      this._iproxyProcess = null;
      return { success: true, message: '端口转发已停止' };
    }
    return { success: true, message: '端口转发未运行' };
  }

  // 获取状态
  getStatus() {
    return {
      iproxyRunning: !!this._iproxyProcess,
      serverRunning: this._isServerRunning,
      deviceConnected: this._deviceConnected,
      hostPort: this._hostPort,
      devicePort: this._devicePort
    };
  }

  // 配置端口
  configurePorts(hostPort, devicePort) {
    if (this._iproxyProcess) {
      return { success: false, message: '端口转发正在运行，请先停止' };
    }
    
    this._hostPort = hostPort || 3000;
    this._devicePort = devicePort || 3000;
    
    return { success: true, message: '端口配置已更新' };
  }

  // 设置服务状态
  setServerRunning(isRunning) {
    this._isServerRunning = isRunning;
  }

  // 启动状态检查定时器
  startStatusCheck(callback) {
    // 清除现有的定时器
    if (this._statusCheckInterval) {
      clearInterval(this._statusCheckInterval);
    }

    // 立即执行一次检查
    this.checkIPhoneConnection().then(callback);

    // 设置定期检查
    this._statusCheckInterval = setInterval(async () => {
      const connected = await this.checkIPhoneConnection();
      callback(connected);
    }, 5000);  // 每5秒检查一次
  }

  // 停止状态检查定时器
  stopStatusCheck() {
    if (this._statusCheckInterval) {
      clearInterval(this._statusCheckInterval);
      this._statusCheckInterval = null;
    }
  }

  // 清理资源
  cleanup() {
    this.stopIproxy();
    this.stopStatusCheck();
  }

  // 使用指定参数直接启动 iproxy（用于手动调试）
  startIproxyWithParams(devicePort, hostPort) {
    if (this._iproxyProcess) {
      return { success: false, message: '已有 iproxy 进程在运行，请先停止' };
    }

    return new Promise((resolve) => {
      console.log(`[USB] 直接启动 iproxy: ${devicePort} ${hostPort}`);
      
      this._iproxyProcess = spawn('iproxy', [`${devicePort}`, `${hostPort}`]);

      this._iproxyProcess.stdout.on('data', (data) => {
        console.log(`[USB] iproxy stdout: ${data}`);
      });

      this._iproxyProcess.stderr.on('data', (data) => {
        console.log(`[USB] iproxy stderr: ${data}`);
      });

      this._iproxyProcess.on('error', (error) => {
        console.error('[USB] 启动 iproxy 失败:', error);
        this._iproxyProcess = null;
        resolve({ success: false, message: `启动失败: ${error.message}` });
      });

      this._iproxyProcess.on('close', (code) => {
        console.log(`[USB] iproxy 进程退出，退出码: ${code}`);
        this._iproxyProcess = null;
      });

      setTimeout(() => {
        if (this._iproxyProcess) {
          this._devicePort = devicePort;
          this._hostPort = hostPort;
          console.log(`[USB] iproxy 已成功启动，参数: ${devicePort} ${hostPort}`);
          resolve({ success: true, message: '启动成功' });
        } else {
          console.error('[USB] iproxy 启动失败');
          resolve({ success: false, message: '启动失败' });
        }
      }, 500);
    });
  }
}

module.exports = new UsbMuxService(); 