const axios = require('axios');

exports.handler = async function (event, context) {
    const query = event.queryStringParameters.q;

    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing query parameter 'q'" }),
        };
    }

    try {
        // World Bank Documents & Reports API
        const url = `https://search.worldbank.org/api/v2/wds?format=json&qterm=${encodeURIComponent(query)}&fl=docdt,count,display_title,url,abstracts&rows=10`;

        const response = await axios.get(url);
        const data = response.data;

        const results = [];

        // The API returns an object where keys are IDs, or sometimes a 'documents' object.
        // We need to parse it carefully.
        const documents = data.documents || {};

        for (const key in documents) {
            if (documents.hasOwnProperty(key)) {
                const doc = documents[key];
                // Skip metadata keys if any (API structure can be quirky)
                if (typeof doc !== 'object') continue;

                results.push({
                    title: doc.display_title,
                    link: doc.url,
                    snippet: doc.abstracts ? doc.abstracts.cdata : (doc.docdt || 'No date')
                });
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ results }),
        };
    } catch (error) {
        console.error("Search error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch search results from World Bank API" }),
        };
    }
};
