import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testApiKeys() {
  const apiKeys = [
    process.env.API_KEY,
    process.env.API_KEY_2,
    process.env.API_KEY_3,
    process.env.API_KEY_4,
    process.env.API_KEY_5,
    process.env.API_KEY_6,
    process.env.API_KEY_7,
    process.env.API_KEY_8,
    process.env.API_KEY_9,
    process.env.API_KEY_10,
    process.env.API_KEY_11
  ].filter(Boolean);

  console.log(`Testing ${apiKeys.length} API keys...`);

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    console.log(`Testing key ${i + 1}: ${apiKey.substring(0, 20)}...`);

    try {
      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-pro' });
      const response = await model.generateContent('Hello, respond with "API key is working!"');
      const text = response.response.text();
      console.log(`✅ Key ${i + 1} SUCCESS:`, text);
      return true; // Exit on first success
    } catch (error) {
      console.log(`❌ Key ${i + 1} FAILED:`, error.message);
    }
  }

  console.log('🚨 All API keys failed!');
  return false;
}

testApiKeys().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
