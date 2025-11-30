const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let mainWindow;
let searchServer = null;
let translateServer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 560,
    height: 350,
    resizable: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 새 창 열기 허용 (로그 창용)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'allow' };
  });

  mainWindow.loadFile(path.join(__dirname, 'launcher.html'));
}

// 검색 서버 시작
ipcMain.handle('start-search-server', async () => {
  if (searchServer) {
    return { success: false, message: 'Already running' };
  }

  try {
    const serverPath = path.join(__dirname, 'servers', 'WBS-server.js');
    console.log('[Main] Starting search server:', serverPath);

    searchServer = spawn(process.execPath, [serverPath], {
      cwd: path.join(__dirname, 'servers'),
      env: { ...process.env, ELECTRON_RUN_AS_NODE: 1 },
      stdio: 'pipe',
      shell: false
    });

    searchServer.stdout.on('data', (data) => {
      console.log(`[Search] ${data}`);
      mainWindow.webContents.send('server-log', {
        server: 'search',
        message: data.toString(),
        type: 'info'
      });
    });

    searchServer.stderr.on('data', (data) => {
      console.error(`[Search Error] ${data}`);
      mainWindow.webContents.send('server-log', {
        server: 'search',
        message: data.toString(),
        type: 'error'
      });
    });

    searchServer.on('close', (code) => {
      console.log(`[Search] Server stopped with code ${code}`);
      searchServer = null;
      mainWindow.webContents.send('server-stopped', 'search');
    });

    // 서버 시작 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true };
  } catch (error) {
    console.error('[Main] Error starting search server:', error);
    return { success: false, message: error.message };
  }
});

// 검색 서버 중지
ipcMain.handle('stop-search-server', async () => {
  if (!searchServer) {
    return { success: false, message: 'Not running' };
  }

  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${searchServer.pid} /T /F`);
    } else {
      searchServer.kill();
    }
    searchServer = null;
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 번역 서버 시작
ipcMain.handle('start-translate-server', async (event, apiKey) => {
  if (translateServer) {
    return { success: false, message: 'Already running' };
  }

  try {
    const serverPath = path.join(__dirname, 'servers', 'WBT-server.js');
    console.log('[Main] Starting translate server:', serverPath);

    // API 키를 환경 변수로 주입
    const env = { ...process.env, ELECTRON_RUN_AS_NODE: 1, GEMINI_API_KEY: apiKey };

    translateServer = spawn(process.execPath, [serverPath], {
      cwd: path.join(__dirname, 'servers'),
      stdio: 'pipe',
      shell: false,
      env: env
    });

    translateServer.stdout.on('data', (data) => {
      console.log(`[Translate] ${data}`);
      mainWindow.webContents.send('server-log', {
        server: 'translate',
        message: data.toString(),
        type: 'info'
      });
    });

    translateServer.stderr.on('data', (data) => {
      console.error(`[Translate Error] ${data}`);
      mainWindow.webContents.send('server-log', {
        server: 'translate',
        message: data.toString(),
        type: 'error'
      });
    });

    translateServer.on('close', (code) => {
      console.log(`[Translate] Server stopped with code ${code}`);
      translateServer = null;
      mainWindow.webContents.send('server-stopped', 'translate');
    });

    // 서버 시작 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true };
  } catch (error) {
    console.error('[Main] Error starting translate server:', error);
    return { success: false, message: error.message };
  }
});

// 번역 서버 중지
ipcMain.handle('stop-translate-server', async () => {
  if (!translateServer) {
    return { success: false, message: 'Not running' };
  }

  try {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${translateServer.pid} /T /F`);
    } else {
      translateServer.kill();
    }
    translateServer = null;
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// 외부 브라우저 열기
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // 서버 종료
  if (searchServer) {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${searchServer.pid} /T /F`);
    } else {
      searchServer.kill();
    }
  }
  if (translateServer) {
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${translateServer.pid} /T /F`);
    } else {
      translateServer.kill();
    }
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});