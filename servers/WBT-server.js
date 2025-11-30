const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoint
app.post('/api/translate', async (req, res) => {
    try {
        const { text } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || req.body.apiKey;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        if (!apiKey) {
            return res.status(400).json({ error: 'API Key is required' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Translate the following text to Korean. If it is already in Korean, translate it to English. Only provide the translation, no other text:\n\n${text}`;

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
