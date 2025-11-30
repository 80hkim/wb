const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text, url } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || req.body.apiKey;

        if ((!text && !url) || !apiKey) {
            return res.status(400).json({ error: 'Text/URL and API Key are required' });
        }

        let textToTranslate = text;

        if (url) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const $ = cheerio.load(response.data);

                let extractedText = '';
                $('p, h1, h2, h3, h4, h5, h6, li').each((i, el) => {
                    const t = $(el).text().trim();
                    if (t.length > 20) {
                        extractedText += t + '\n\n';
                    }
                });

                if (!extractedText) {
                    return res.status(400).json({ error: "Could not extract text from URL" });
                }

                textToTranslate = extractedText.substring(0, 5000); // Safety limit

            } catch (e) {
                return res.status(400).json({ error: "Failed to fetch URL: " + e.message });
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Translate the following text to Korean. If it is already in Korean, translate it to English. Only provide the translation, no other text:\n\n${textToTranslate}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const translation = response.text();

        res.json({ translation });

    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve UI for standalone usage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/translate.html'));
});

app.listen(PORT, () => {
    console.log(`Translate Server running on http://localhost:${PORT}`);
});
