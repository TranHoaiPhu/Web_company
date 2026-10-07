import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;

async function testModelName(modelName) {
  console.log(`\n🧪 Testing model: ${modelName}`);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent("Hello");
    const text = result.response.text();

    console.log(`✅ SUCCESS! Model "${modelName}" works!`);
    console.log(`Response: ${text.slice(0, 100)}...`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Gemini model names with @google/generative-ai');
  console.log(`🔑 API Key: ${API_KEY ? API_KEY.slice(0, 10) + '...' : 'NOT SET'}\n`);

  const modelsToTest = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  const results = {};

  for (const modelName of modelsToTest) {
    results[modelName] = await testModelName(modelName);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY:');
  console.log('='.repeat(60));

  for (const [model, success] of Object.entries(results)) {
    console.log(`${success ? '✅' : '❌'} ${model}`);
  }

  const working = Object.entries(results).filter(([_, success]) => success).map(([model]) => model);

  if (working.length > 0) {
    console.log(`\n✅ Working models: ${working.join(', ')}`);
    console.log(`\n💡 Recommended: Use "${working[0]}" in your .env file`);
    console.log(`   GEMINI_MODEL=${working[0]}`);
  } else {
    console.log('\n❌ No models worked. Check your API key!');
  }
}

main().catch(console.error);
