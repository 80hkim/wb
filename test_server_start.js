const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const serverDir = path.join(__dirname, 'servers');
const serverPath = path.join(serverDir, 'WBT-server.js');

console.log('Testing Translate Server Startup...');
console.log('Server Dir:', serverDir);
console.log('Server Path:', serverPath);

// Check if node_modules exists in servers
if (fs.existsSync(path.join(serverDir, 'node_modules'))) {
    console.log('servers/node_modules exists.');
} else {
    console.error('servers/node_modules MISSING!');
}

// Try to resolve express from server dir
try {
    const expressPath = require.resolve('express', { paths: [serverDir] });
    console.log('Found express at:', expressPath);
} catch (e) {
    console.error('Failed to resolve express from server dir:', e.message);
}

// Spawn the server
console.log('Spawning server...');
const server = spawn(process.execPath, [serverPath], {
    cwd: serverDir,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: 1, GEMINI_API_KEY: 'TEST_KEY' },
    stdio: 'pipe',
    shell: false
});

server.stdout.on('data', (data) => {
    console.log(`[STDOUT] ${data}`);
});

server.stderr.on('data', (data) => {
    console.error(`[STDERR] ${data}`);
});

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
});

// Kill after 5 seconds
setTimeout(() => {
    console.log('Killing test server...');
    server.kill();
}, 5000);
