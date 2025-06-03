const { fetch } = require('undici');
const fg = require('fast-glob');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const { cosineSimilarity, findBestMatch } = require('../utils/semanticSearch');

let vectorDB = [];

const files = fg.sync([path.join(os.homedir(), 'Documents/**/*')], {
    onlyFiles: true,
    dot: false,
});

let apps = [];
try {
    apps = execSync(`ls /usr/share/applications ~/.local/share/applications /var/lib/snapd/desktop/applications | sed 's/\\.desktop$//'`)
        .toString().split('\n').filter(Boolean);
} catch (err) {
    console.error('App scan failed:', err.message);
}

// Embeds text using BGE-M3 via Ollama
async function getEmbedding(text) {
    const res = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'bge-m3', prompt: text }),
    });
    const data = await res.json();
    //console.log('Embedded', data);
    return data.embedding;
}

// Builds in-memory vector DB from file/app names
async function initializeEmbeddings() {
    const items = [
        ...files.map(f => ({ type: 'file', name: path.basename(f) })),
        ...apps.map(app => ({ type: 'app', name: app })),
    ];

    vectorDB = await Promise.all(items.map(async item => {
        try {
            const embedding = await getEmbedding(item.name);
            //console.log("First embedding:", embedding[0]);
            return { ...item, embedding };
            //console.log("Loaded embeddings:", embedding.length);


        } catch {
            return null;
        }
    }));

    vectorDB = vectorDB.filter(Boolean); // remove failed
    console.log(`✅ Embedded ${vectorDB.length} items`);
    //console.log(` Embedding ${vectorDB[0]} items`);
}

// Main function: uses vector DB + user prompt to find best match
async function askOllama(prompt) {
    const queryEmbedding = await getEmbedding(prompt);
    //console.log(queryEmbedding);
    const match = findBestMatch(queryEmbedding, vectorDB);
    console.log(match);
    if (!match) return null;
    let intent = 'open';
    if(match.type === 'app') intent = 'open_app';
    else if (match.name.match(/\.(mp3|mp4|wav|mkv|mov)$/)) intent = 'play';
    // let intent = 'open'; // fallback
    // const lower = prompt.toLowerCase();
    // if (lower.includes('play')) intent = 'play';
    // else if (lower.includes('open') && match.type === 'app') intent = 'open_app';
    // else if (match.name.match(/\.(mp3|mp4|wav|mkv|mov)$/)) intent = 'play';

    return { intent, target: match.name };
}

module.exports = { askOllama, initializeEmbeddings };
