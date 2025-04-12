const { ipcRenderer } = require('electron');

const input = document.getElementById('prompt');
input.focus();

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const prompt = input.value.trim();
        if (prompt) {
            const response = await ipcRenderer.invoke('ask-ai', prompt);
            console.log('AI Response:', response);
            ipcRenderer.send('hide-window'); // hide popup after action
        }
    }

    if (e.key === 'Escape') {
        ipcRenderer.send('hide-window'); // just hide on Esc
    }
});
