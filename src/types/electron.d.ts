interface ElectronAPI {
  selectFile: () => Promise<string>;
  selectFolder: () => Promise<string>;
  selectImage: () => Promise<string>;
  saveImage: (imageData: string, fileName?: string) => Promise<{path: string, success: boolean, message?: string}>;
  getAppImagesDir: () => Promise<string>;
}

declare interface Window {
  electronAPI: ElectronAPI;
} 