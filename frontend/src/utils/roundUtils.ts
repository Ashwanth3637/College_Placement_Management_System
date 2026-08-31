/**
 * Utility helper to format round names cleanly without duplicate prefixes
 * (e.g. avoiding "Round 2: Round 3: HR Round" or "Assessment11111111").
 */
export const formatCleanRoundName = (roundNum: number, rawName?: string): string => {
    if (!rawName || typeof rawName !== "string") {
        return `Round ${roundNum}`;
    }

    let clean = rawName.trim();

    // Remove duplicate leading "Round X:" or "Round X"
    clean = clean.replace(/^Round\s*\d+\s*:\s*/i, "");
    clean = clean.replace(/^Round\s*\d+\s*/i, "");
    clean = clean.replace(/^Round\s*:\s*/i, "");

    // Remove repetitive trailing digits like "11111111" or "0000000"
    clean = clean.replace(/1{4,}/g, "").replace(/0{4,}/g, "").trim();

    if (!clean) {
        return `Round ${roundNum}`;
    }

    return `Round ${roundNum}: ${clean}`;
};

/**
 * Strips "Round X: " prefix to get only the pure title name (e.g. "Technical Assessment").
 */
export const getPureRoundTitle = (rawName?: string, fallback: string = "Selection Round"): string => {
    if (!rawName || typeof rawName !== "string") return fallback;
    let clean = rawName.replace(/^Round\s*\d+\s*:\s*/i, "").replace(/^Round\s*\d+\s*/i, "").trim();
    clean = clean.replace(/1{4,}/g, "").replace(/0{4,}/g, "").trim();
    return clean || fallback;
};
