module.exports = (req, res) => {
    // Show ALL environment variable names (not values) that contain redis, kv, or upstash
    const relevantVars = {};
    for (const key of Object.keys(process.env)) {
        const lower = key.toLowerCase();
        if (lower.includes('redis') || lower.includes('kv') || lower.includes('upstash')) {
            relevantVars[key] = '***defined***';
        }
    }
    res.json({
        found: Object.keys(relevantVars).length,
        variables: relevantVars
    });
};
