const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 5555;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        // World Bank Documents & Reports API
        const url = `https://search.worldbank.org/api/v2/wds?format=json&qterm=${encodeURIComponent(query)}&fl=docdt,count,display_title,url,abstracts&rows=10`;

        const response = await axios.get(url);
        const data = response.data;

        const results = [];
        const documents = data.documents || {};

        for (const key in documents) {
            if (documents.hasOwnProperty(key)) {
                const doc = documents[key];
                if (typeof doc !== 'object') continue;

                results.push({
                    title: doc.display_title,
                    link: doc.url,
                    snippet: doc.abstracts ? doc.abstracts.cdata : (doc.docdt || 'No date')
                });
            }
        }

        res.json({ results });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: 'Failed to fetch search results from World Bank API' });
    }
});

// Serve UI for standalone usage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/search.html'));
});

app.listen(PORT, () => {
    console.log(`Search Server running on http://localhost:${PORT}`);
});
