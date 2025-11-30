const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function (event, context) {
    const query = event.queryStringParameters.q;

    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing query parameter 'q'" }),
        };
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
            if (i >= 10) return false; // Limit to 10 results

            const titleElement = $(element).find('.result__a');
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            const snippet = $(element).find('.result__snippet').text().trim();

            if (title && link) {
                results.push({ title, link, snippet });
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ results }),
        };
    } catch (error) {
        console.error("Search error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch search results" }),
        };
    }
};
