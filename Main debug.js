const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let searchServer = null;
let translateServer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 450,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true // 개발자 도구 활성화
    }
  });

  mainWindow.loadFile('launcher-final.html');
  
  // 개발자 도구 자동 열기
  mainWindow.webContents.openDevTools();
}

function sendLog(server, message, type = 'info') {
  console.log(`[${server}] ${message}`);
  if (mainWindow) {
    mainWindow.webContents.send('server-log', {
      server: server,
      message: message,
      type: type
    });
  }
}

// 검색 서버 시작
ipcMain.handle('start-search-server', async () => {
  if (searchServer) {
    return { success: false, message: 'Already running' };
  }

  try {
    const serverPath = path.join(__dirname, 'servers', 'WBS-server.js');
    const serverDir = path.join(__dirname, 'servers');
    
    console.log('[Main] =================================');
    console.log('[Main] Starting SEARCH server');
    console.log('[Main] Server path:', serverPath);
    console.log('[Main] Server dir:', serverDir);
    console.log('[Main] File exists:', fs.existsSync(serverPath));
    console.log('[Main] =================================');
    
    if (!fs.existsSync(serverPath)) {
      sendLog('search', 'Server file not found: ' + serverPath, 'error');
      return { success: false, message: 'Server file not found' };
    }
    
    sendLog('search', 'Starting server at port 3000...', 'info');
    
    searchServer = spawn('node', [serverPath], {
      cwd: serverDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env }
    });

    searchServer.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      console.log(`[Search STDOUT] ${msg}`);
      sendLog('search', msg, 'info');
    });

    searchServer.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.error(`[Search STDERR] ${msg}`);
      sendLog('search', msg, 'error');
    });

    searchServer.on('error', (error) => {
      console.error(`[Search ERROR]`, error);
      sendLog('search', 'Failed to start: ' + error.message, 'error');
      searchServer = null;
    });

    searchServer.on('close', (code) => {
      console.log(`[Search] Process closed with code ${code}`);
      sendLog('search', 'Process closed (code: ' + code + ')', 'info');
      searchServer = null;
      if (mainWindow) {
        mainWindow.webContents.send('server-stopped', 'search');
      }
    });

    // 2초 대기 후 성공 여부 확인
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (searchServer && !searchServer.killed) {
      sendLog('search', 'Server started successfully on port 3000', 'success');
      return { success: true, message: 'Search server started' };
    } else {
      return { success: false, message: 'Server failed to start' };
    }
  } catch (error) {
    console.error('[Main] Search server error:', error);
    sendLog('search', 'Exception: ' + error.message, 'error');
    return { success: false, message: error.message };
  }
});

// 검색 서버 중지
ipcMain.handle('stop-search-server', async () => {
  if (!searchServer) {
    return { success: false, message: 'Not running' };
  }

  console.log('[Main] Stopping search server...');
  sendLog('search', 'Stopping server...', 'info');
  
  searchServer.kill();
  searchServer = null;
  
  return { success: true, message: 'Search server stopped' };
});

// 번역 서버 시작
ipcMain.handle('start-translate-server', async () => {
  if (translateServer) {
    return { success: false, message: 'Already running' };
  }

  try {
    const serverPath = path.join(__dirname, 'servers', 'WBT-server.js');
    const serverDir = path.join(__dirname, 'servers');
    
    console.log('[Main] =================================');
    console.log('[Main] Starting TRANSLATE server');
    console.log('[Main] Server path:', serverPath);
    console.log('[Main] Server dir:', serverDir);
    console.log('[Main] File exists:', fs.existsSync(serverPath));
    console.log('[Main] =================================');
    
    if (!fs.existsSync(serverPath)) {
      sendLog('translate', 'Server file not found: ' + serverPath, 'error');
      return { success: false, message: 'Server file not found' };
    }
    
    sendLog('translate', 'Starting server at port 8080...', 'info');
    
    translateServer = spawn('node', [serverPath], {
      cwd: serverDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env }
    });

    translateServer.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      console.log(`[Translate STDOUT] ${msg}`);
      sendLog('translate', msg, 'info');
    });

    translateServer.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.error(`[Translate STDERR] ${msg}`);
      sendLog('translate', msg, 'error');
    });

    translateServer.on('error', (error) => {
      console.error(`[Translate ERROR]`, error);
      sendLog('translate', 'Failed to start: ' + error.message, 'error');
      translateServer = null;
    });

    translateServer.on('close', (code) => {
      console.log(`[Translate] Process closed with code ${code}`);
      sendLog('translate', 'Process closed (code: ' + code + ')', 'info');
      translateServer = null;
      if (mainWindow) {
        mainWindow.webContents.send('server-stopped', 'translate');
      }
    });

    // 2초 대기 후 성공 여부 확인
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (translateServer && !translateServer.killed) {
      sendLog('translate', 'Server started successfully on port 8080', 'success');
      return { success: true, message: 'Translate server started' };
    } else {
      return { success: false, message: 'Server failed to start' };
    }
  } catch (error) {
    console.error('[Main] Translate server error:', error);
    sendLog('translate', 'Exception: ' + error.message, 'error');
    return { success: false, message: error.message };
  }
});

// 번역 서버 중지
ipcMain.handle('stop-translate-server', async () => {
  if (!translateServer) {
    return { success: false, message: 'Not running' };
  }

  console.log('[Main] Stopping translate server...');
  sendLog('translate', 'Stopping server...', 'info');
  
  translateServer.kill();
  translateServer = null;
  
  return { success: true, message: 'Translate server stopped' };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  console.log('[Main] Cleaning up servers...');
  
  if (searchServer) {
    searchServer.kill();
    searchServer = null;
  }
  if (translateServer) {
    translateServer.kill();
    translateServer = null;
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