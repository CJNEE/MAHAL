module.exports = (req, res) => {
    res.json({
        KV_REST_API_URL_DEFINED: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN_DEFINED: !!process.env.KV_REST_API_TOKEN,
        UPSTASH_REDIS_REST_URL_DEFINED: !!process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN_DEFINED: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        KV_URL_DEFINED: !!process.env.KV_URL
    });
};
