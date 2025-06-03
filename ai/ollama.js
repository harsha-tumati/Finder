const { fetch } = require('undici');
const fg = require('fast-glob');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { cosineSimilarity, findBestMatch } = require('../utils/semanticSearch');

const tempFilePath = path.join(os.tmpdir(), 'embeddings-temp.json');

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
    return data.embedding;
}

// Builds vector DB from file/app names or loads from temp file
async function initializeEmbeddings() {
    // ✅ If temp file exists, load from it
    if (fs.existsSync(tempFilePath)) {
        try {
            const data = fs.readFileSync(tempFilePath, 'utf-8');
            vectorDB = JSON.parse(data);
            console.log(`✅ Loaded ${vectorDB.length} embeddings from temp file`);
            console.log('📝 Temp embeddings path:', tempFilePath);
            return;
        } catch (err) {
            console.error('⚠️ Failed to load embeddings from temp file:', err);
        }
    }

    const items = [
        ...files.map(f => ({ type: 'file', name: path.basename(f) })),
        ...apps.map(app => ({ type: 'app', name: app })),
    ];

    vectorDB = await Promise.all(items.map(async item => {
        try {
            const embedding = await getEmbedding(item.name);
            return { ...item, embedding };
        } catch {
            return null;
        }
    }));

    vectorDB = vectorDB.filter(Boolean);
    fs.writeFileSync(tempFilePath, JSON.stringify(vectorDB, null, 2));
    console.log(`✅ Generated and saved ${vectorDB.length} embeddings`);
}

// Deletes temp file on exit
function cleanupEmbeddings() {
    if (fs.existsSync(tempFilePath)) {
        console.log('tempFilePath =', tempFilePath);
        fs.unlinkSync(tempFilePath);
        console.log('🧹 Temporary embedding DB deleted');
    }
}

// Uses vector DB + user prompt to find best match
async function askOllama(prompt) {
    const queryEmbedding = await getEmbedding(prompt);
    const match = findBestMatch(queryEmbedding, vectorDB);
    if (!match) return null;
    let intent = 'open';
    if (match.type === 'app') intent = 'open_app';
    else if (match.name.match(/\.(mp3|mp4|wav|mkv|mov)$/)) intent = 'play';
    return { intent, target: match.name };
}

module.exports = { askOllama, initializeEmbeddings, cleanupEmbeddings };
