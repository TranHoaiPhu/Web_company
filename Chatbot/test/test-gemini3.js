/**
 * Test Gemini 3 Flash Preview API
 * Test the new @google/genai SDK directly
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_CLOUD_API_KEY || process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

console.log('🧪 Testing Gemini 3 Flash Preview API\n');
console.log('=' .repeat(60));
console.log(`🔑 API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`📊 Model: ${MODEL}`);
console.log('=' .repeat(60) + '\n');

// Test 1: Basic text generation
async function testBasicGeneration() {
  console.log('🧪 Test 1: Basic Text Generation\n');

  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    const generationConfig = {
      maxOutputTokens: 1024,
      temperature: 0.7,
      topP: 0.95,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        }
      ],
    };

    const req = {
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Xin chào! Bạn là ai?' }]
        }
      ],
      config: generationConfig,
    };

    console.log('📤 Sending request...');
    const startTime = Date.now();

    const response = await ai.models.generateContent(req);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Response time: ${duration}ms\n`);

    // Extract text from response
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const text = candidate.content.parts[0].text;
        console.log('✅ Response received:');
        console.log('-'.repeat(60));
        console.log(text);
        console.log('-'.repeat(60));
        return true;
      }
    }

    console.log('❌ No valid response from API');
    console.log('Full response:', JSON.stringify(response, null, 2));
    return false;

  } catch (error) {
    console.log('❌ Test FAILED!');
    console.log('Error:', error.message);
    if (error.stack) {
      console.log('\nStack trace:');
      console.log(error.stack);
    }
    return false;
  }
}

// Test 2: Streaming generation
async function testStreamingGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Test 2: Streaming Generation\n');

  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    const generationConfig = {
      maxOutputTokens: 1024,
      temperature: 0.7,
      topP: 0.95,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        }
      ],
    };

    const req = {
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Gợi ý 3 nhà hàng ngon ở Hà Nội' }]
        }
      ],
      config: generationConfig,
    };

    console.log('📤 Sending streaming request...');
    const startTime = Date.now();

    const streamingResp = await ai.models.generateContentStream(req);

    console.log('✅ Streaming response:');
    console.log('-'.repeat(60));

    let fullText = '';
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        fullText += chunk.text;
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n' + '-'.repeat(60));
    console.log(`⏱️ Streaming time: ${duration}ms`);
    console.log(`📏 Total characters: ${fullText.length}`);
    return true;

  } catch (error) {
    console.log('❌ Test FAILED!');
    console.log('Error:', error.message);
    return false;
  }
}

// Test 3: Travel query (realistic use case)
async function testTravelQuery() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Test 3: Travel Query (Realistic Use Case)\n');

  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
    });

    const generationConfig = {
      maxOutputTokens: 2048,
      temperature: 0.7,
      topP: 0.95,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'OFF',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'OFF',
        }
      ],
    };

    const systemPrompt = `Bạn là TourMate - trợ lý du lịch AI chuyên nghiệp.
Nhiệm vụ: Phân tích câu hỏi du lịch và trả về JSON với format sau:
{
  "category": "food|accommodation|attractions|weather|transportation|budget|itinerary|general",
  "location": "tên địa điểm",
  "intent": "mô tả ý định",
  "keywords": ["từ khóa 1", "từ khóa 2"],
  "urgency": "low|medium|high",
  "searchQuery": "query để search"
}

QUAN TRỌNG: Chỉ trả về JSON, không giải thích gì thêm.`;

    const userQuery = "Lịch trình du lịch Đà Lạt 2 ngày 1 đêm, ngân sách 3 triệu";

    const req = {
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Query: ${userQuery}` }]
        }
      ],
      config: generationConfig,
    };

    console.log(`📤 Query: "${userQuery}"`);
    console.log('📤 Sending request...\n');

    const startTime = Date.now();
    const response = await ai.models.generateContent(req);
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const text = candidate.content.parts[0].text;

        console.log('✅ Response received:');
        console.log('-'.repeat(60));
        console.log(text);
        console.log('-'.repeat(60));
        console.log(`⏱️ Response time: ${duration}ms`);

        // Try to parse as JSON
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('\n✅ Successfully parsed JSON:');
            console.log(JSON.stringify(parsed, null, 2));
            return true;
          } else {
            console.log('\n⚠️ Response is not JSON format');
            return false;
          }
        } catch (parseError) {
          console.log('\n❌ Failed to parse JSON:', parseError.message);
          return false;
        }
      }
    }

    console.log('❌ No valid response from API');
    return false;

  } catch (error) {
    console.log('❌ Test FAILED!');
    console.log('Error:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  if (!API_KEY) {
    console.log('❌ ERROR: API Key not set!');
    console.log('\nPlease set one of:');
    console.log('  - GOOGLE_CLOUD_API_KEY');
    console.log('  - GEMINI_API_KEY');
    console.log('\nIn your .env file\n');
    process.exit(1);
  }

  const results = {
    basicGeneration: false,
    streamingGeneration: false,
    travelQuery: false
  };

  // Run tests sequentially
  results.basicGeneration = await testBasicGeneration();
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.streamingGeneration = await testStreamingGeneration();
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.travelQuery = await testTravelQuery();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Basic Generation: ${results.basicGeneration ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Streaming Generation: ${results.streamingGeneration ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Travel Query: ${results.travelQuery ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}\n`);

  if (allPassed) {
    console.log('✅ Gemini 3 Flash Preview is working correctly!');
    console.log('✅ You can now use this model in your chatbot.');
    console.log('\n💡 Next steps:');
    console.log('  1. Run: npm install');
    console.log('  2. Start chatbot: npm run dev');
    console.log('  3. Test API: npm run test:api\n');
  } else {
    console.log('❌ Please check:');
    console.log('  1. API key is valid');
    console.log('  2. Model name is correct');
    console.log('  3. Network connection');
    console.log('  4. @google/genai package is installed\n');
  }
}

// Run tests
runAllTests().catch(console.error);
