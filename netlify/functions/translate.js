const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text, url, apiKey } = JSON.parse(event.body);

    if ((!text && !url) || !apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing text/url or apiKey" }),
      };
    }

    let textToTranslate = text;

    // If URL is provided, fetch and extract text
    if (url) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const $ = cheerio.load(response.data);

        // Extract meaningful text (paragraphs, headers, list items)
        // Limit to ~2000 characters to avoid token limits for this demo
        let extractedText = '';
        $('p, h1, h2, h3, h4, h5, h6, li').each((i, el) => {
          const t = $(el).text().trim();
          if (t.length > 20) {
            extractedText += t + '\n\n';
          }
        });

        if (!extractedText) {
          return { statusCode: 400, body: JSON.stringify({ error: "Could not extract text from URL" }) };
        }

        textToTranslate = extractedText.substring(0, 5000); // Safety limit

      } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Failed to fetch URL: " + e.message }) };
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Translate the following text to Korean. If it is already in Korean, translate it to English. Only provide the translation, no other text:\n\n${textToTranslate}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ translation }),
    };
  } catch (error) {
    console.error("Translation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
