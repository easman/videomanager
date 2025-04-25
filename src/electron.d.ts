export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  selectVideo: () => Promise<string | null>;
  selectImage: () => Promise<string | null>;
  saveImage: (imageData: string) => Promise<{ success: boolean; path?: string; message?: string }>;
  getAppImagesDir: () => Promise<string>;
  clearDirectory: (dirPath: string) => Promise<{ success: boolean; message?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 