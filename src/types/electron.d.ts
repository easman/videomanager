interface ElectronAPI {
  selectFile: () => Promise<string>;
  selectFolder: () => Promise<string>;
  saveImage: (imageData: string, fileName?: string) => Promise<{path: string, success: boolean, message?: string}>;
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
  
  // HTTP 服务相关 API
  configureHttpServer: (options: { port?: number; uploadDir?: string }) => Promise<{ success: boolean; message?: string }>;
  startHttpServer: () => Promise<{ 
    success: boolean; 
    message?: string;
    port?: number;
    uploadDir?: string;
  }>;
  stopHttpServer: () => Promise<{ success: boolean; message?: string }>;
}

declare interface Window {
  electronAPI: ElectronAPI;
} 