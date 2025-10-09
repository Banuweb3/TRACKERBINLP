import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testSimpleModel() {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.log('No API key found');
    return;
  }

  console.log(`Testing API key: ${apiKey.substring(0, 20)}...`);

  try {
    const ai = new GoogleGenerativeAI(apiKey);

    // Try different model names
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'text-bison-001', // PaLM model (older)
      'chat-bison-001'  // PaLM model (older)
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = ai.getGenerativeModel({ model: modelName });
        const response = await model.generateContent('Hello, respond with "API key is working!"');
        const text = response.response.text();
        console.log(`✅ SUCCESS with ${modelName}:`, text);
        return modelName;
      } catch (modelError) {
        console.log(`❌ ${modelName} failed:`, modelError.message.substring(0, 100) + '...');
      }
    }

  } catch (error) {
    console.log('❌ API key test failed:', error.message);
  }

  return null;
}

testSimpleModel().then(result => {
  console.log('Final result:', result ? `Working model: ${result}` : 'No working models found');
}).catch(console.error);
