interface ElectronAPI {
  selectFile: () => Promise<string>;
  selectFolder: () => Promise<string>;
}

declare interface Window {
  electronAPI: ElectronAPI;
} 