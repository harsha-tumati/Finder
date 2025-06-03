function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2) return -1;
    const dot = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (mag1 * mag2);
}

function findBestMatch(queryVec, db) {
    let best = null;
    let bestScore = -1;

    for (const item of db) {
        const score = cosineSimilarity(queryVec, item.embedding);
        if (score > bestScore) {
            bestScore = score;
            best = item;
        }
    }

    return best;
}

module.exports = { cosineSimilarity, findBestMatch };
