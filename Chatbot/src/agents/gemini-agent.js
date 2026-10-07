import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAuth } from 'google-auth-library';
import { config } from '../config/index.js';
import {
  TRAVEL_ASSISTANT_SYSTEM_PROMPT,
  QUERY_ANALYSIS_PROMPT,
  RESPONSE_GENERATION_PROMPT
} from '../prompts/travel-assistant.js';
import {
  findUniversities,
  getUniversityContext,
  findLocationsByName,
  getLocationContext
} from '../data/vietnam-universities.js';

/**
 * Travel Assistant Agent using Google Gemini
 * Supports both AI Studio (API key) and Vertex AI (Service Account)
 */
export class GeminiTravelAgent {
  constructor() {
    this.useVertexAI = config.gemini.useVertexAI || false;
    this.projectId = config.gemini.projectId;
    this.location = config.gemini.location || 'us-central1';

    if (this.useVertexAI) {
      console.log('🔧 Initializing Vertex AI with Service Account...');
      this.initVertexAI();
    } else {
      console.log('🔧 Initializing AI Studio with API Key...');
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: config.gemini.model,
        generationConfig: {
          temperature: config.llm.temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: config.app.maxTokens,
        }
      });
    }
  }

  /**
   * Initialize Vertex AI with service account authentication
   */
  async initVertexAI() {
    try {
      // Support 2 authentication methods:
      // 1. gcloud auth (RECOMMENDED - no file needed!)
      // 2. Service account key file (for CI/CD or if gcloud not available)
      const authOptions = {
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      };

      // Only use keyFilename if explicitly set (not 'none')
      if (config.gemini.serviceAccountKeyPath && config.gemini.serviceAccountKeyPath !== 'none') {
        authOptions.keyFilename = config.gemini.serviceAccountKeyPath;
        console.log('🔑 Using service account key file');
      } else {
        console.log('🔑 Using gcloud auth (Application Default Credentials)');
      }

      this.auth = new GoogleAuth(authOptions);
      this.client = await this.auth.getClient();
      this.modelName = config.gemini.model;

      console.log('✅ Vertex AI initialized successfully');
      console.log(`📊 Project: ${this.projectId}`);
      console.log(`📍 Location: ${this.location}`);
      console.log(`🤖 Model: ${this.modelName}`);
    } catch (error) {
      console.error('❌ Failed to initialize Vertex AI:', error);
      throw error;
    }
  }

  /**
   * Analyze user query to extract travel intent and context
   * @param {string} query - User's travel query
   * @param {Array} conversationHistory - Previous conversation context
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeQuery(query, conversationHistory = []) {
    try {
      // Check for specific location mentions and enhance context
      const locationContext = this.extractLocationContext(query);

      // Format conversation history for context
      const historyContext = conversationHistory.length > 0
        ? conversationHistory.slice(-4).map(msg =>
            `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
          ).join('\n')
        : 'No previous conversation';

      // Enhance query with location context if found
      let enhancedQuery = query;
      if (locationContext) {
        enhancedQuery += ` [Context: ${locationContext.searchContext}]`;
      }

      const prompt = QUERY_ANALYSIS_PROMPT
        .replace('{query}', enhancedQuery)
        .replace('{conversationHistory}', historyContext);

      // Generate content based on authentication method
      const text = await this.generateContent(prompt);

      // Parse JSON response
      const analysis = this.parseAnalysisResult(text);

      // Add location context to analysis if found
      if (locationContext) {
        analysis.locationContext = locationContext;
        if (locationContext.location) {
          analysis.location = analysis.location || locationContext.location.city;
          analysis.searchQuery = analysis.searchQuery + ' ' + locationContext.nearbyKeywords;
        }
      }

      return analysis;

    } catch (error) {
      console.error('❌ Query analysis error:', error);

      // Return error instead of fallback
      throw new Error(`Failed to analyze query: ${error.message}`);
    }
  }

  /**
   * Generate content using either AI Studio or Vertex AI
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} Generated text
   */
  async generateContent(prompt) {
    if (this.useVertexAI) {
      return await this.generateContentVertexAI(prompt);
    } else {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    }
  }

  /**
   * Generate content using Vertex AI
   * @param {string} prompt - The prompt to send
   * @returns {Promise<string>} Generated text
   */
  async generateContentVertexAI(prompt) {
    try {
      const accessToken = await this.client.getAccessToken();

      // For location=global, use aiplatform.googleapis.com (no location prefix)
      // For regional locations, use {location}-aiplatform.googleapis.com
      const baseUrl = this.location === 'global'
        ? 'https://aiplatform.googleapis.com'
        : `https://${this.location}-aiplatform.googleapis.com`;

      const endpoint = `${baseUrl}/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelName}:generateContent`;

      const requestBody = {
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: config.llm.temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: config.app.maxTokens,
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
        const errorText = await response.text();
        throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Vertex AI');
      }

      const text = data.candidates[0].content.parts[0].text;
      return text;

    } catch (error) {
      console.error('❌ Vertex AI generation error:', error);
      throw error;
    }
  }

  /**
   * Extract location context from query (universities, companies, malls, etc.)
   * @param {string} query - User query
   * @returns {Object|null} Location context or null
   */
  extractLocationContext(query) {
    // First try universities
    const universities = findUniversities(query);
    if (universities.length === 1) {
      return getUniversityContext(universities[0].code);
    } else if (universities.length > 1) {
      return {
        type: 'university',
        multipleMatches: universities,
        needsClarification: true
      };
    }

    // Then try other locations (companies, malls, hospitals, etc.)
    const locations = findLocationsByName(query);
    if (locations.length === 1) {
      return getLocationContext(locations[0].code);
    } else if (locations.length > 1) {
      return {
        type: 'general',
        multipleMatches: locations,
        needsClarification: true
      };
    }

    return null;
  }

  /**
   * Generate response based on search results
   * @param {string} originalQuery - Original user query
   * @param {Array} searchResults - Search results from Tavily
   * @returns {Promise<string>} Generated response
   */
  async generateResponse(originalQuery, searchResults) {
    try {


      // Format search results for the prompt
      const formattedResults = this.formatSearchResultsForPrompt(searchResults);

      const prompt = `${TRAVEL_ASSISTANT_SYSTEM_PROMPT}

${RESPONSE_GENERATION_PROMPT
  .replace('{originalQuery}', originalQuery)
  .replace('{searchResults}', formattedResults)}`;

      const text = await this.generateContent(prompt);

      console.log('✅ Response generated');
      return text;

    } catch (error) {
      console.error('❌ Response generation error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  /**
   * Generate a simple response without search (for basic queries)
   * @param {string} query - User query
   * @returns {Promise<string>} Simple response
   */
  async generateSimpleResponse(query) {
    try {


      const prompt = `${TRAVEL_ASSISTANT_SYSTEM_PROMPT}

User: ${query}

Assistant:`;

      const text = await this.generateContent(prompt);

      return text;

    } catch (error) {
      console.error('❌ Simple response error:', error);
      throw new Error(`Failed to generate simple response: ${error.message}`);
    }
  }

  /**
   * Parse analysis result from Gemini response
   * @param {string} content - Gemini response content
   * @returns {Object} Parsed analysis
   */
  parseAnalysisResult(content) {
    try {
      // Try to extract JSON from the response - more flexible regex
      let jsonMatch = content.match(/\{[\s\S]*?\}/);

      if (!jsonMatch) {
        // Try to find JSON in code blocks
        jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }

      if (!jsonMatch) {
        // Try to find any object-like structure
        jsonMatch = content.match(/\{[^}]*\}/);
      }

      if (jsonMatch) {
        let jsonStr = jsonMatch[0];

        // Clean up common issues
        jsonStr = jsonStr.replace(/'/g, '"'); // Replace single quotes
        jsonStr = jsonStr.replace(/(\w+):/g, '"$1":'); // Add quotes to keys
        jsonStr = jsonStr.replace(/,\s*}/g, '}'); // Remove trailing commas

        const parsed = JSON.parse(jsonStr);

        // Validate that it's a travel-related query
        if (!this.isValidTravelQuery(parsed)) {
          throw new Error('Query is not travel-related');
        }

        return parsed;
      }

      throw new Error('No valid JSON found in analysis response');

    } catch (error) {
      console.error('❌ Could not parse analysis result:', error.message);
      console.error('❌ Original content:', content);
      throw new Error(`Invalid query analysis: ${error.message}`);
    }
  }

  /**
   * Validate if the query is travel-related
   * @param {Object} analysis - Parsed analysis object
   * @returns {boolean} True if valid travel query
   */
  isValidTravelQuery(analysis) {
    // Check if analysis has required fields
    if (!analysis.category || !analysis.intent) {
      return false;
    }

    // Explicitly reject non-travel queries
    if (analysis.category === 'non_travel' || analysis.intent === 'not_travel_related') {
      return false;
    }

    // Valid travel categories
    const validCategories = ['food', 'accommodation', 'attractions', 'weather', 'transportation', 'itinerary', 'general', 'budget', 'safety'];

    // Check if category is travel-related
    if (!validCategories.includes(analysis.category)) {
      return false;
    }

    return true;
  }



  /**
   * Format search results for prompt
   * @param {Array} searchResults - Search results
   * @returns {string} Formatted results
   */
  formatSearchResultsForPrompt(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return 'No search results available.';
    }

    return searchResults
      .slice(0, 5) // Limit to top 5 results
      .map((result, index) =>
        `Result ${index + 1}:
Title: ${result.title}
Content: ${result.content}
URL: ${result.url}
---`
      )
      .join('\n\n');
  }


}