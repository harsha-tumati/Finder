const { exec } = require('child_process');

function openFile(filePath) {
    console.log(`Opening ${filePath}`);
    exec(`xdg-open "${filePath}"`);
}

function playFile(filePath) {
    exec(`open "${filePath}"`);
}
function openApp(filePath) {
    exec(`"${filePath.toLowerCase()}" &`);
}

module.exports = { openFile, playFile,openApp };
