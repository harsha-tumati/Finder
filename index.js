const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const os = require('os');
const { askOllama } = require('./ai/ollama');
const { parseCommandFromAIResponse } = require('./ai/parser');
const { searchFile } = require('./utils/fileSearch');
const { openFile, playFile } = require('./utils/actions');
if (!app.requestSingleInstanceLock()) {
    app.quit();
}

let mainWindow;
let tray = null;

const searchPaths = [path.join(os.homedir(), 'Documents')];

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

app.on('will-quit', () => globalShortcut.unregisterAll());

ipcMain.handle('ask-ai', async (event, prompt) => {
    const response = await askOllama(prompt);
    const command = parseCommandFromAIResponse(response);

    if (!command) return "Couldn't understand the command.";
    let foundFile = null;
    for (const dir of searchPaths) {
        const results = searchFile(dir, command.target);
        if (results.length > 0) {
            foundFile = results[0];
            break;
        }
    }

    if (!foundFile) return `Couldn't find any file matching "${command.target}"`;

    if (command.intent === 'open') openFile(foundFile);
    else if (command.intent === 'play') playFile(foundFile);

    return `Executing ${command.intent} on ${foundFile}`;
});


