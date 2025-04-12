function parseCommandFromAIResponse(response) {
    if (!response) return null;

    const match = response.match(/\b(open|play)\s+(?:the\s+file\s+)?([\w\-.]+\.\w+)/i);

    if (match) {
        const intent = match[1].toLowerCase();
        const target = match[2];
        return { intent, target };
    }

    return null; // or throw an error/log warning
}

module.exports = { parseCommandFromAIResponse };
