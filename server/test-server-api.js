import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testServerAPI() {
  try {
    // Test if API_KEY_2 works directly
    const apiKey = process.env.API_KEY_2;
    console.log('Testing API_KEY_2:', apiKey.substring(0, 20) + '...');

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const response = await model.generateContent("Hello, respond with 'API key is working!'");
    const text = response.response.text();

    console.log('✅ API_KEY_2 works:', text);

    // Test the complete workflow like the server does
    console.log('\n🔄 Testing complete analysis workflow...');

    // This should work if the server is properly configured
    const testResponse = await fetch('http://localhost:3001/health');
    console.log('Server health check:', testResponse.ok ? 'OK' : 'FAILED');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServerAPI();
