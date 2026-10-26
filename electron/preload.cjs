/**
 * preload.cjs — Electron Preload Bridge for ZoroLevel
 * 
 * Exposes a minimal, hardened API surface into window.electronAPI
 * enabling durable native backups and system information.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  /**
   * Returns permanent directories used for storage
   */
  getPaths: () => ipcRenderer.invoke('app:get-paths'),

  /**
   * Safely writes backup snapshot into the dedicated native backups folder
   */
  saveNativeBackup: (filename, data) => ipcRenderer.invoke('backup:save', filename, data),

  /**
   * Lists native backup snapshots stored in OS user data folder
   */
  listNativeBackups: () => ipcRenderer.invoke('backup:list'),

  /**
   * Reads a native backup file's contents
   */
  readNativeBackup: (filename) => ipcRenderer.invoke('backup:read', filename),
});
