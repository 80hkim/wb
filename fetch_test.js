const axios = require('axios');

async function fetchUrl() {
    try {
        const url = 'https://projects.worldbank.org/en/projects-operations/project-detail/P174267';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        console.log(response.data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fetchUrl();
