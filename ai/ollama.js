const { fetch } = require('undici');

const fg = require('fast-glob');
const { execSync } = require('child_process');
let filteredApps = [];
try {
    filteredApps = execSync(`snap list | awk 'NR>1 {print $1}'`)
        .toString()
        .split('\n')
        .filter(Boolean); // removes empty lines
    // console.log(output);
    //  filteredApps= output.filter(app => app.includes('nodejs'));
    console.log(filteredApps); // array of matching app names
} catch (err) {
    console.error('Error:', err.message);
}
const files = fg.sync(['/home/harsha/Documents/**/*'], {
  onlyFiles: true,
  dot: false // exclude hidden files/folders
});

console.log("working",files);
// Example usage
const allFiles = files;

async function askOllama(userPrompt) {
    const systemPrompt = `
You must respond with EXACTLY one line in this strict format: "<intent> <filename_or_appname>", such as "open notes.txt", "play song.mp3", or "open_app Chrome". 
- INTENT is REQUIRED and must be one of: open, play, open_app.
- Do NOT explain, add comments, or use any other words.
- Only use filenames from this list: ${allFiles}
- Only use app names from this list: ${filteredApps}
- For .mp3/.mp4/.wav/.mkv/.mov use 'play' intent.
- For .txt/.pdf/.docx and similar documents
- Use from given list of file names and app names only, Don't change the casing.`
    console.log(systemPrompt);
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
