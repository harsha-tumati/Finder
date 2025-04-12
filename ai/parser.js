function parseCommandFromAIResponse(response) {
    if (!response) return null;
    console.log("Raw response",response);
    //const match = response.match(/\b(open|play)\s+(?:the\s+file\s+)?([\w\-.]+\.\w+)/i);
    const [intent, target] = response.split(" ")
    // if (match) {
    //     const intent = match[1].toLowerCase();
    //     const target = match[2];
    //     console.log("Logging result",intent,target);
         return { intent, target };
    // }

   // return null; // or throw an error/log warning
}

module.exports = { parseCommandFromAIResponse };
