/**
 * main.cjs — Electron Main Process for ZoroLevel
 * 
 * 100% Offline, Zero Cloud, Permanent Local Storage Architecture.
 * Stores database and rotating backups in OS permanent user-data directory.
 * Never uses temp or cache directories.
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Enforce single instance lock to prevent simultaneous writes / database corruption
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// ── Permanent OS Storage Path ────────────────────────────────────────────────
// Explicitly pin userData to permanent OS AppData directory:
// Windows: %APPDATA%\ZoroLevel
// macOS:   ~/Library/Application Support/ZoroLevel
// Linux:   ~/.config/ZoroLevel
const customUserData = path.join(app.getPath('appData'), 'ZoroLevel');
app.setPath('userData', customUserData);

const backupsDir = path.join(customUserData, 'backups');
if (!fs.existsSync(backupsDir)) {
  try {
    fs.mkdirSync(backupsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create permanent backups dir:', err);
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#030712',
    title: 'ZoroLevel ⚡ Productivity Tracker',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      enableWebSQL: false,
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Load production dist bundle or dev server
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default system browser, never inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── IPC Handlers: Permanent Storage & Native Rotating Backup ─────────────────

ipcMain.handle('app:get-paths', async () => {
  return {
    userData: app.getPath('userData'),
    appData: app.getPath('appData'),
    backupsDir,
    platform: process.platform,
    version: app.getVersion(),
  };
});

ipcMain.handle('backup:save', async (event, filename, data) => {
  try {
    const safeFilename = path.basename(filename || `zorolevel-backup-${Date.now()}.json`);
    const targetPath = path.join(backupsDir, safeFilename);
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    // Atomic write using temp file and rename to prevent corrupted writes on sudden crash
    const tempPath = targetPath + '.tmp';
    fs.writeFileSync(tempPath, jsonString, 'utf-8');
    fs.renameSync(tempPath, targetPath);

    return { success: true, path: targetPath };
  } catch (err) {
    console.error('IPC backup:save failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('backup:list', async () => {
  try {
    if (!fs.existsSync(backupsDir)) return [];
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));
    const list = files.map(filename => {
      const filePath = path.join(backupsDir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        path: filePath,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    });
    // Sort newest first
    list.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    return list;
  } catch (err) {
    console.error('IPC backup:list failed:', err);
    return [];
  }
});

ipcMain.handle('backup:read', async (event, filename) => {
  try {
    const safeFilename = path.basename(filename);
    const targetPath = path.join(backupsDir, safeFilename);
    if (!fs.existsSync(targetPath)) {
      throw new Error('Backup file does not exist');
    }
    const content = fs.readFileSync(targetPath, 'utf-8');
    return { success: true, data: JSON.parse(content) };
  } catch (err) {
    console.error('IPC backup:read failed:', err);
    return { success: false, error: err.message };
  }
});
