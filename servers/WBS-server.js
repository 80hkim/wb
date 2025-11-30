const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
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
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('.result').each((i, element) => {
            if (i >= 10) return false;

            const titleElement = $(element).find('.result__a');
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            const snippet = $(element).find('.result__snippet').text().trim();

            if (title && link) {
                results.push({ title, link, snippet });
            }
        });

        res.json({ results });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

// Serve UI for standalone usage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/search.html'));
});

app.listen(PORT, () => {
    console.log(`Search Server running on http://localhost:${PORT}`);
});
