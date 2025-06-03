const { exec } = require('child_process');
const path = require('path');
const os = require('os');

function openFile(filename) {
    // Construct the full path to the Documents directory
    const documentsPath = path.join(os.homedir(), 'Documents');
    const fullPath = path.join(documentsPath, filename);

    // Sanitize the path (replace single quotes as they can break the command)
    const sanitizedPath = fullPath.replace(/'/g, "'\\''");

    // Use the appropriate command based on the OS
    const command = process.platform === 'win32'
        ? `start "" "${sanitizedPath}"`
        : process.platform === 'darwin'
            ? `open "${sanitizedPath}"`
            : `xdg-open "${sanitizedPath}"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Failed to open file: ${error.message}`);
            // You could try fallback methods here if needed
        }
    });
}

function playFile(filePath) {
    const sanitizedPath = filePath.replace(/"/g, '\\"'); // Escape quotes

    // Try different Linux media players in order of preference
    const players = [
        'vlc',          // VLC Media Player
        'mpv',          // MPV Player
        'smplayer',     // SMPlayer
        'totem',       // GNOME Videos
        'xdg-open',     // Default application
        'mplayer'       // MPlayer (fallback)
    ];

    const tryPlayer = (index) => {
        if (index >= players.length) {
            console.error(`Could not play file: ${filePath}`);
            return;
        }

        const command = `${players[index]} "${sanitizedPath}" >/dev/null 2>&1 &`;
        exec(command, (error) => {
            if (error) {
                console.log(`Trying next player... (${players[index]} not available)`);
                tryPlayer(index + 1);
            }
        });
    };

    tryPlayer(0);
}
// function openApp(filePath) {
//     console.log(`${filePath}`);
//     exec(`"${filePath.toLowerCase()}" &`);
// }

function openApp(appName) {
    // Remove any quotes that might interfere
    const sanitized = appName.replace(/['"]/g, '').trim();

    // Try different methods to launch the app
    const commands = [
        `gtk-launch ${sanitized}`,
        `xdg-open ${sanitized}.desktop`,
        `setsid ${sanitized} >/dev/null 2>&1 &`
    ];

    // Try each command until one works
    const tryCommand = (index) => {
        if (index >= commands.length) {
            console.error(`Failed to launch ${sanitized}`);
            return;
        }

        exec(commands[index], (error) => {
            if (error) {
                console.log(`Trying next method for ${sanitized}...`);
                tryCommand(index + 1);
            }
        });
    };

    tryCommand(0);
}
module.exports = { openFile, playFile,openApp };
