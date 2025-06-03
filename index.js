const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const os = require('os');
const { askOllama, initializeEmbeddings,cleanupEmbeddings } = require('./ai/ollama');
const { parseCommandFromAIResponse } = require('./ai/parser');
const { openFile, playFile, openApp } = require('./utils/actions');

if (!app.requestSingleInstanceLock()) app.quit();

let mainWindow;
let tray = null;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 100,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        transparent: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    await mainWindow.loadFile('renderer/index.html');
    mainWindow.hide();
}

app.whenReady().then(async () => {
    await initializeEmbeddings(); // ⚠️ Generate vector DB on startup
    await createWindow();
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Launcher', click: () => mainWindow.show() },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('AI Launcher');
    tray.setContextMenu(contextMenu);

    globalShortcut.register('Control+Space', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
});

app.on('will-quit', () => {
    cleanupEmbeddings();
    globalShortcut.unregisterAll()
});

ipcMain.handle('ask-ai', async (event, prompt) => {
    const command = await askOllama(prompt); // now includes semantic search
    if (!command) return "Couldn't understand the command.";
    console.log(command);
    if (command.intent === 'open') {
        console.log(`Opening ${command.target}`);
        openFile(command.target);

    }
    else if (command.intent === 'play'){
        console.log(`Playing ${command.target}`);
        playFile(command.target);
    }
    else if (command.intent === 'open_app') {
        console.log(`Opening ${command.target}`);
        openApp(command.target);
    }

    return `Executing ${command.intent} on ${command.target}`;
});
