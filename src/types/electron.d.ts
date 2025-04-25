interface ElectronAPI {
  selectFile: () => Promise<string>;
  selectFolder: () => Promise<string>;
  selectImage: () => Promise<string>;
  saveImage: (imageData: string, fileName?: string) => Promise<{path: string, success: boolean, message?: string}>;
  getAppImagesDir: () => Promise<string>;
  clearDirectory: (dirPath: string) => Promise<{ success: boolean; message?: string }>;
}

declare interface Window {
  electronAPI: ElectronAPI;
} 