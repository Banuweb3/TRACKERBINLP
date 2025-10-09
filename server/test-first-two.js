import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testFirstTwoKeys() {
  const apiKeys = [
    process.env.API_KEY,
    process.env.API_KEY_2
  ].filter(Boolean);

  console.log(`Testing first ${apiKeys.length} API keys...`);

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    console.log(`\n🔑 Testing API Key ${i + 1}: ${apiKey.substring(0, 20)}...`);

    try {
      const ai = new GoogleGenerativeAI(apiKey);

      // Try gemini-2.5-flash first (as requested by user)
      try {
        console.log(`  Trying model: gemini-2.5-flash`);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const response = await model.generateContent('Hello, respond with "API key is working!"');
        const text = response.response.text();
        console.log(`  ✅ SUCCESS with gemini-2.5-flash:`, text);
        console.log(`  🎉 API Key ${i + 1} is WORKING!`);
        return true;
      } catch (modelError) {
        console.log(`  ❌ gemini-2.5-flash failed:`, modelError.message.substring(0, 100) + '...');
      }

      // Try alternative models
      const alternativeModels = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];

      for (const modelName of alternativeModels) {
        try {
          console.log(`  Trying model: ${modelName}`);
          const model = ai.getGenerativeModel({ model: modelName });
          const response = await model.generateContent('Hello, respond with "API key is working!"');
          const text = response.response.text();
          console.log(`  ✅ SUCCESS with ${modelName}:`, text);
          console.log(`  🎉 API Key ${i + 1} works with ${modelName}!`);
          return true;
        } catch (altError) {
          console.log(`  ❌ ${modelName} failed:`, altError.message.substring(0, 80) + '...');
        }
      }

      console.log(`  ❌ API Key ${i + 1}: No working models found`);

    } catch (error) {
      console.log(`  ❌ API Key ${i + 1} ERROR:`, error.message);
    }
  }

  console.log(`\n🚨 Neither of the first two API keys are working!`);
  return false;
}

testFirstTwoKeys().then(success => {
  console.log('\nFinal result:', success ? '✅ At least one API key is working!' : '❌ No API keys are working');
}).catch(console.error);
