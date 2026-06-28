module.exports = (req, res) => {
    res.json({
        SUPABASE_URL_DEFINED: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY_DEFINED: !!process.env.SUPABASE_ANON_KEY
    });
};
