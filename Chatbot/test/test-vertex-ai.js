import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH || 'none';
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'travelweb-485107';
const LOCATION = process.env.GCP_LOCATION || 'global';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

const useGcloudAuth = SERVICE_ACCOUNT_KEY_PATH === 'none';

// Helper function: delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function: fetch with exponential backoff retry for 429 errors
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if (response.status === 429 && attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
      console.log(`   ⏳ Rate limited (429). Retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
      await delay(waitTime);
      continue;
    }

    // For non-429 errors or max retries exceeded, throw error
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
}

console.log('🧪 Testing Vertex AI Authentication\n');
console.log('='.repeat(60));
console.log('🔑 Auth Method:', useGcloudAuth ? 'gcloud auth (recommended)' : 'Service account file');
if (!useGcloudAuth) {
  console.log('🔑 Service Account Key:', SERVICE_ACCOUNT_KEY_PATH);
}
console.log('📊 GCP Project ID:', PROJECT_ID);
console.log('📍 Location:', LOCATION);
console.log('🤖 Model:', MODEL_NAME);
console.log('='.repeat(60) + '\n');

async function testVertexAI() {
  try {
    // Step 1: Initialize Google Auth
    console.log('🔐 Step 1: Initializing Google Auth...');

    const authOptions = {
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };

    // Only use keyFilename if not using gcloud auth
    if (!useGcloudAuth) {
      authOptions.keyFilename = SERVICE_ACCOUNT_KEY_PATH;
      console.log('   Using service account key file');
    } else {
      console.log('   Using gcloud auth (Application Default Credentials)');
    }

    const auth = new GoogleAuth(authOptions);

    const client = await auth.getClient();
    console.log('✅ Google Auth client initialized\n');

    // Step 2: Get access token
    console.log('🎫 Step 2: Getting access token...');
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    console.log('✅ Access token obtained:', accessToken.token.slice(0, 20) + '...\n');

    // Step 3: Test basic text generation
    console.log('🧪 Step 3: Testing basic text generation with Vertex AI...');
    console.log('📤 Sending request to Vertex AI...\n');

    // For location=global, use aiplatform.googleapis.com (no location prefix)
    const baseUrl = LOCATION === 'global'
      ? 'https://aiplatform.googleapis.com'
      : `https://${LOCATION}-aiplatform.googleapis.com`;

    const endpoint = `${baseUrl}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_NAME}:generateContent`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: 'Xin chào! Bạn là ai?' }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const startTime = Date.now();

    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Vertex AI');
    }

    const text = data.candidates[0].content.parts[0].text;

    console.log('✅ Response received!\n');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));
    console.log(`\n⏱️ Response time: ${responseTime}ms\n`);

    // Step 4: Test travel-related query (with delay to avoid rate limiting)
    console.log('⏳ Waiting 3 seconds before next request to avoid rate limiting...');
    await delay(3000);

    console.log('🧪 Step 4: Testing travel query...');
    console.log('📤 Query: "Gợi ý lịch trình du lịch Đà Lạt 2 ngày 1 đêm"\n');

    const travelRequest = {
      contents: [{
        role: 'user',
        parts: [{ text: 'Gợi ý lịch trình du lịch Đà Lạt 2 ngày 1 đêm với ngân sách 3 triệu đồng' }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const startTime2 = Date.now();

    const response2 = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(travelRequest)
    });

    const responseTime2 = Date.now() - startTime2;

    const data2 = await response2.json();
    const text2 = data2.candidates[0].content.parts[0].text;

    console.log('✅ Response received!\n');
    console.log('─'.repeat(60));
    console.log(text2.slice(0, 500) + '...');
    console.log('─'.repeat(60));
    console.log(`\n⏱️ Response time: ${responseTime2}ms`);
    console.log(`📏 Response length: ${text2.length} characters\n`);

    // Summary
    console.log('='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Google Auth initialization: PASS');
    console.log('✅ Access token retrieval: PASS');
    console.log('✅ Basic text generation: PASS');
    console.log('✅ Travel query generation: PASS');
    console.log('='.repeat(60));
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✅ Vertex AI with Service Account is working correctly!');
    console.log('✅ You can now use this model in your chatbot.\n');
    console.log('💡 Next steps:');
    console.log('  1. Update .env: USE_VERTEX_AI=true');
    console.log('  2. Set GEMINI_MODEL=gemini-1.5-flash (or gemini-2.0-flash-exp)');
    console.log('  3. Start chatbot: npm run dev');
    console.log('  4. Test API: npm run test:api\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!\n');
    console.error('Error:', error.message);

    if (error.message.includes('ENOENT')) {
      console.error('\n💡 Fix: Make sure service-account-key.json exists in Chatbot folder');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n💡 Fix: Check that service account has correct permissions');
      console.error('   Required: Vertex AI User role');
    } else if (error.message.includes('404')) {
      console.error('\n💡 Fix: Model name might be incorrect or not available');
      console.error('   Try: gemini-1.5-flash or gemini-1.5-pro');
    }

    console.error('\n📚 Troubleshooting:');
    console.error('  1. Verify service-account-key.json exists');
    console.error('  2. Check GCP_PROJECT_ID is correct');
    console.error('  3. Ensure Vertex AI API is enabled in GCP');
    console.error('  4. Verify service account has "Vertex AI User" role\n');

    process.exit(1);
  }
}

testVertexAI().catch(console.error);
