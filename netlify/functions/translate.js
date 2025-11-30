const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text, apiKey } = JSON.parse(event.body);

    if (!text || !apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing text or apiKey" }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Translate the following text to Korean. If it is already in Korean, translate it to English. Only provide the translation, no other text:\n\n${text}`;

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
