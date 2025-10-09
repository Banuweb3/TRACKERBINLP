import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiInServer() {
  console.log('🔑 Testing API_KEY_2 with Gemini service logic...');

  const apiKey = process.env.API_KEY_2;
  if (!apiKey) {
    console.log('❌ API_KEY_2 not found');
    return;
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const response = await model.generateContent('Hello, respond with "API key is working!"');
    const text = response.response.text();
    console.log('✅ API_KEY_2 works:', text);

    console.log('🔄 Testing with transcription-like prompt...');

    // Test the kind of prompt the server uses for transcription
    const transcriptionPrompt = 'Transcribe this audio exactly as spoken. Use speaker labels (Speaker 1:, Speaker 2:, etc.) to identify different speakers.';

    const textResponse = await model.generateContent(transcriptionPrompt);
    const textResult = textResponse.response.text();
    console.log('✅ Transcription prompt works, length:', textResult.length);

  } catch (error) {
    console.log('❌ API_KEY_2 failed:', error.message);
    console.log('Error type:', error.constructor.name);
  }
}

testGeminiInServer();
