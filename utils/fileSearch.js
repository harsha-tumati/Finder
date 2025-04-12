const fs = require('fs');
const path = require('path');

function searchFile(startPath, query) {
    const results = [];

    function searchDir(currentPath) {
        const files = fs.readdirSync(currentPath);
        for (const file of files) {
            const fullPath = path.join(currentPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                searchDir(fullPath);
            } else if (file.toLowerCase().includes(query.toLowerCase())) {
                results.push(fullPath);
            }
        }
    }

    try {
        searchDir(startPath);
    } catch (err) {
        console.error('Error searching:', err);
    }

    return results;
}

module.exports = { searchFile };
