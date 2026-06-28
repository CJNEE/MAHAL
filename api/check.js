module.exports = (req, res) => {
    res.json({
        KV_REST_API_URL_DEFINED: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN_DEFINED: !!process.env.KV_REST_API_TOKEN,
        KV_URL_DEFINED: !!process.env.KV_URL
    });
};
