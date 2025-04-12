const { fetch } = require('undici');

async function askOllama(userPrompt) {
    const systemPrompt = "Respond ONLY with one line containing an action and file name, e.g., 'open harsha.txt' or 'play song.mp3'. Do not include explanations.";

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "mistral",
            prompt: `${systemPrompt}\n\nUser: ${userPrompt}`,
            stream: false,
        }),
    });

    const data = await response.json();
    return data.response.trim();
}

module.exports = { askOllama };
