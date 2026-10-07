import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SERVICE_ACCOUNT_KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json';
const PROJECT_ID = process.env.GCP_PROJECT_ID || 'travelweb-485107';
const LOCATION = process.env.GCP_LOCATION || 'us-central1';

console.log('🧪 Testing Different Vertex AI Model Names\n');
console.log('='.repeat(60));
console.log('🔑 Service Account Key:', SERVICE_ACCOUNT_KEY_PATH);
console.log('📊 GCP Project ID:', PROJECT_ID);
console.log('📍 Location:', LOCATION);
console.log('='.repeat(60) + '\n');

// List of models to try
const modelsToTest = [
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash',
  'gemini-1.5-pro-001',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.0-pro-001'
];

async function testModel(auth, modelName) {
  try {
    console.log(`\n🧪 Testing: ${modelName}`);

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelName}:generateContent`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [{ text: 'Hello' }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorCode = errorData.error?.code || response.status;
      const errorMsg = errorData.error?.message || 'Unknown error';

      if (errorCode === 404) {
        console.log(`   ❌ NOT FOUND - Model doesn't exist or not enabled`);
      } else if (errorCode === 403) {
        console.log(`   ❌ FORBIDDEN - No permission`);
      } else {
        console.log(`   ❌ ERROR ${errorCode}: ${errorMsg.slice(0, 100)}`);
      }
      return false;
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    console.log(`   ✅ WORKS! Response: ${text.slice(0, 50)}...`);
    return true;

  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    // Initialize auth
    const auth = new GoogleAuth({
      keyFilename: SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    console.log('🔐 Initializing Google Auth...');
    const client = await auth.getClient();
    await client.getAccessToken();
    console.log('✅ Authentication successful\n');

    console.log('🔍 Testing models...');

    const results = {};

    for (const modelName of modelsToTest) {
      results[modelName] = await testModel(auth, modelName);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(60));

    const working = Object.entries(results).filter(([_, works]) => works);
    const notWorking = Object.entries(results).filter(([_, works]) => !works);

    console.log('\n✅ WORKING MODELS:');
    if (working.length === 0) {
      console.log('   None found');
    } else {
      working.forEach(([model]) => {
        console.log(`   ✅ ${model}`);
      });
    }

    console.log('\n❌ NOT AVAILABLE:');
    notWorking.forEach(([model]) => {
      console.log(`   ❌ ${model}`);
    });

    if (working.length > 0) {
      console.log('\n💡 RECOMMENDED:');
      console.log(`   Use: ${working[0][0]}`);
      console.log(`   Update .env: GEMINI_MODEL=${working[0][0]}`);
    } else {
      console.log('\n⚠️ NO MODELS WORKING!');
      console.log('\n📚 Possible issues:');
      console.log('   1. Vertex AI API not enabled in GCP project');
      console.log('   2. Service account missing "Vertex AI User" role');
      console.log('   3. Region us-central1 may not have these models');
      console.log('\n💡 To fix:');
      console.log('   1. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com');
      console.log('   2. Select project: travelweb-485107');
      console.log('   3. Click "Enable API"');
      console.log('   4. Go to IAM & Admin → Service Accounts');
      console.log('   5. Add "Vertex AI User" role to vertex-express@travelweb-485107.iam.gserviceaccount.com');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
