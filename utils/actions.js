const { exec } = require('child_process');

function openFile(filePath) {
    exec(`xdg-open "${filePath}"`);
}

function playFile(filePath) {
    exec(`ffplay -autoexit -nodisp "${filePath}"`);
}

module.exports = { openFile, playFile };
