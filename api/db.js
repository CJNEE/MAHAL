module.exports = async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ 
            error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your Vercel environment variables." 
        });
    }

    const { type } = req.query;
    if (type !== 'settings' && type !== 'memories') {
        return res.status(400).json({ error: "Invalid type parameter. Must be 'settings' or 'memories'." });
    }

    const key = `forjane_${type}`;
    const restUrl = `${supabaseUrl}/rest/v1/config`;
    const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
    };

    try {
        if (req.method === 'GET') {
            const response = await fetch(`${restUrl}?key=eq.${key}&select=value`, {
                method: 'GET',
                headers
            });
            const data = await response.json();
            if (!response.ok) {
                return res.status(500).json({ error: data.message || JSON.stringify(data) });
            }
            // data is an array of rows; return the value or null
            if (Array.isArray(data) && data.length > 0) {
                return res.status(200).json(data[0].value);
            }
            return res.status(200).json(null);

        } else if (req.method === 'POST') {
            const body = req.body;
            // Upsert: insert or update on conflict
            const response = await fetch(`${restUrl}`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({ key: key, value: body })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                return res.status(500).json({ error: errData.message || response.statusText });
            }
            return res.status(200).json({ success: true });

        } else if (req.method === 'DELETE') {
            const response = await fetch(`${restUrl}?key=eq.${key}`, {
                method: 'DELETE',
                headers
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                return res.status(500).json({ error: errData.message || response.statusText });
            }
            return res.status(200).json({ success: true });

        } else {
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }
    } catch (e) {
        console.error("Database error:", e);
        return res.status(500).json({ error: e.message });
    }
};
