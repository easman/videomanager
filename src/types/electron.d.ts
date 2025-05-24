interface ElectronAPI {
  selectFile: () => Promise<string>;
  selectFolder: () => Promise<string>;
  selectImage: () => Promise<string>;
  saveImage: (imageData: string, fileName?: string) => Promise<{path: string, success: boolean, message?: string}>;
  saveImages: (imagesData: Array<{imageData: string, fileName?: string}>) => Promise<{
    success: boolean;
    results?: Array<{path: string, success: boolean, message?: string}>;
    message?: string;
  }>;
  getAppImagesDir: () => Promise<string>;
  clearDirectory: (dirPath: string) => Promise<{ success: boolean; message?: string }>;
  openFolder: (folderPath: string) => Promise<{ success: boolean; message?: string }>;
  showFileInFolder: (filePath: string) => Promise<{ success: boolean; message?: string }>;
  // 开发者工具相关 API
  isDevToolsEnabled: () => Promise<boolean>;
  toggleDevTools: (enabled: boolean) => Promise<boolean>;
  // 数据导入导出相关 API
  exportData: (dbData: string) => Promise<{ success: boolean; message?: string }>;
  importData: () => Promise<{ success: boolean; dbData?: string; message?: string }>;
  
  // USB 多路复用和 HTTP 服务相关 API
  checkIproxyInstallation: () => Promise<{ success: boolean; isInstalled: boolean }>;
  checkIPhoneConnection: () => Promise<{ success: boolean; isConnected: boolean }>;
  startUsbForwarding: () => Promise<{ success: boolean; message?: string }>;
  stopUsbForwarding: () => Promise<{ success: boolean; message?: string }>;
  configureUsbForwarding: (options: { hostPort?: number; devicePort?: number }) => Promise<{ success: boolean; message?: string }>;
  getUsbServiceStatus: () => Promise<{ 
    success: boolean; 
    status: {
      iproxyRunning: boolean;
      serverRunning: boolean;
      deviceConnected: boolean;
      hostPort: number;
      devicePort: number;
    } 
  }>;
  configureHttpServer: (options: { port?: number; uploadDir?: string }) => Promise<{ success: boolean; message?: string }>;
  startHttpServer: () => Promise<{ 
    success: boolean; 
    message?: string;
    port?: number;
    uploadDir?: string;
  }>;
  stopHttpServer: () => Promise<{ success: boolean; message?: string }>;
  getHttpServerInfo: () => Promise<{ 
    success: boolean; 
    info: {
      running: boolean;
      port: number;
      uploadDir: string;
    } 
  }>;
  
  // 诊断工具
  diagnoseConnection: () => Promise<{
    success: boolean;
    steps?: Array<{
      name: string;
      success: boolean;
      message?: string;
      [key: string]: any;
    }>;
    error?: string;
    timestamp?: string;
  }>;
  
  // 命令执行
  executeCommand: (command: string) => Promise<{
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
    command: string;
  }>;
  
  // 直接启动 iproxy
  startIproxyWithParams: (devicePort: number | string, hostPort: number | string) => Promise<{
    success: boolean;
    message: string;
  }>;
}

declare interface Window {
  electronAPI: ElectronAPI;
} 