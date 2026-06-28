module.exports = async function handler(req, res) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
        return res.status(500).json({ 
            error: "Vercel KV is not configured. Please link a KV database to your project in the Vercel dashboard." 
        });
    }

    const { type } = req.query;
    if (type !== 'settings' && type !== 'memories') {
        return res.status(400).json({ error: "Invalid type parameter. Must be 'settings' or 'memories'." });
    }

    const key = `forjane_${type}`;

    try {
        if (req.method === 'GET') {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(['GET', key])
            });
            const data = await response.json();
            const value = data.result ? JSON.parse(data.result) : null;
            return res.status(200).json(value);
        } else if (req.method === 'POST') {
            const body = req.body;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(['SET', key, JSON.stringify(body)])
            });
            const data = await response.json();
            return res.status(200).json({ success: true, result: data.result });
        } else if (req.method === 'DELETE') {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(['DEL', key])
            });
            const data = await response.json();
            return res.status(200).json({ success: true, result: data.result });
        } else {
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
        }
    } catch (e) {
        console.error("Database error:", e);
        return res.status(500).json({ error: e.message });
    }
};
