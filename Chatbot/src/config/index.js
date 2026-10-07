import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // LLM Provider Configuration
  llm: {
    provider: 'gemini',
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
  },

  // Gemini Configuration
  gemini: {
    // Authentication: Either API Key (AI Studio) or Service Account (Vertex AI)
    apiKey: process.env.GEMINI_API_KEY, // AI Studio API Key
    useVertexAI: process.env.USE_VERTEX_AI === 'true', // Enable Vertex AI
    serviceAccountKeyPath: process.env.SERVICE_ACCOUNT_KEY_PATH || './service-account-key.json',
    projectId: process.env.GCP_PROJECT_ID || 'travelweb-485107',
    location: process.env.GCP_LOCATION || 'global',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },

  // Tavily Search Configuration
  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
  },

  // LangSmith Configuration (optional)
  langsmith: {
    tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === 'true',
    endpoint: process.env.LANGCHAIN_ENDPOINT,
    apiKey: process.env.LANGCHAIN_API_KEY,
    project: process.env.LANGCHAIN_PROJECT || 'travel-chatbot',
  },

  // Application Configuration
  app: {
    maxSearchResults: 5,
    maxTokens: 4000,
    searchTimeout: 30000, // 30 seconds
  }
};

// Validate required configuration
export function validateConfig() {
  const errors = [];

  // Check authentication method
  if (config.gemini.useVertexAI) {
    // Vertex AI requires project ID
    // Authentication can be either:
    // - gcloud auth (recommended)
    // - Service account key file
    if (!config.gemini.projectId) {
      errors.push('GCP_PROJECT_ID is required when USE_VERTEX_AI=true');
    }
  } else {
    // AI Studio requires API key
    if (!config.gemini.apiKey) {
      errors.push('GEMINI_API_KEY is required (or set USE_VERTEX_AI=true to use service account)');
    }
  }

  if (!config.tavily.apiKey) {
    errors.push('TAVILY_API_KEY is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
