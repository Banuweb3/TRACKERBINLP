import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supported languages mapping (matching frontend)
const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'Tamil' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'hi', label: 'Hindi' }
];

// Collect all potential API keys from environment variables
const API_KEYS = [
  process.env.API_KEY_2,  // Start with the working key
  process.env.API_KEY,
  process.env.API_KEY_3,
  process.env.API_KEY_4,
  process.env.API_KEY_5,
  process.env.API_KEY_6,
  process.env.API_KEY_7,
  process.env.API_KEY_8,
  process.env.API_KEY_9,
  process.env.API_KEY_10,
  process.env.API_KEY_11,
  process.env.API_KEY_12,
  process.env.API_KEY_13,
  process.env.API_KEY_14,
  process.env.API_KEY_15,
  process.env.API_KEY_16,
  process.env.API_KEY_17,
  process.env.API_KEY_18,
  process.env.API_KEY_19,
  process.env.API_KEY_20,
].filter(key => !!key);

// Remove duplicates
const UNIQUE_API_KEYS = [...new Set(API_KEYS)];

if (UNIQUE_API_KEYS.length === 0) {
  console.warn("No API key found. Please set API_KEY or API_KEY_2...20 environment variables.");
}

/**
 * Executes a Gemini API request with automatic API key rotation on failure.
 * @param {Function} generateContentCall - Function that takes a GoogleGenAI instance and returns the promise from the API call
 * @returns {Promise} The result of the successful API call
 * @throws {Error} An error if all API keys fail
 */
async function executeWithRetry(generateContentCall) {
  let lastError = null;

  console.log(`🔑 Starting API call with ${UNIQUE_API_KEYS.length} available keys`);

  for (let i = 0; i < UNIQUE_API_KEYS.length; i++) {
    const apiKey = UNIQUE_API_KEYS[i];
    try {
      console.log(`🔑 Trying API key #${i + 1}: ${apiKey.substring(0, 20)}...`);
      const ai = new GoogleGenerativeAI(apiKey);
      const result = await generateContentCall(ai);
      console.log(`✅ API key #${i + 1} succeeded`);
      return result;
    } catch (error) {
      console.warn(`❌ API call with key #${i + 1} failed:`, error.message);
      console.warn(`Error details:`, {
        status: error.status,
        statusText: error.statusText,
        message: error.message
      });
      lastError = error;
    }
  }

  console.error("🚨 All API keys failed. Last error:", lastError);
  throw lastError || new Error("All API keys have failed; please check your keys and quota.");
}

/**
 * Convert buffer to base64
 * @param {Buffer} buffer - Audio buffer
 * @returns {string} Base64 encoded string
 */
const bufferToBase64 = (buffer) => {
  return buffer.toString('base64');
};


/**
 * Transcribe audio using Gemini API
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} mimeType - MIME type of the audio file
 * @param {string} sourceLanguage - Source language code
 * @returns {Promise<string>} Transcription text
 */
export async function transcribeAudio(audioBuffer, mimeType, sourceLanguage) {
  const languageName = SUPPORTED_LANGUAGES.find(lang => lang.value === sourceLanguage)?.label || sourceLanguage;
  
  console.log(`\n=== TRANSCRIPTION PROCESS START ===`);
  console.log(`Expected Language: ${languageName} (${sourceLanguage})`);
  console.log(`Audio size: ${audioBuffer.length} bytes`);
  console.log(`MIME type: ${mimeType}`);
  
  let prompt;
  if (sourceLanguage === 'en') {
    prompt = `Transcribe this English audio exactly as spoken. Use speaker labels (Speaker 1:, Speaker 2:, etc.) to identify different speakers. Format each speaker's dialogue on a new line with the speaker label followed by their speech.`;
  } else {
    prompt = `Transcribe this ${languageName} audio exactly in ${languageName} script/text - DO NOT translate to English. Keep all words in original ${languageName}. Use speaker labels (Speaker 1:, Speaker 2:, etc.) to identify different speakers. Format each speaker's dialogue on a new line with the speaker label followed by their speech.`;
  }

  try {
    const base64Audio = bufferToBase64(audioBuffer);

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Audio,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await executeWithRetry(async (ai) => {
      const model = ai.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192
        }
      });
      return await model.generateContent([audioPart, textPart]);
    });

    const transcription = response.response.text().trim();
    
    console.log(`Transcription length: ${transcription.length}`);
    console.log(`Transcription preview: "${transcription.substring(0, 300)}..."`);
    console.log(`Contains English words: ${/\b(the|and|is|are|was|were|have|has|will|would|could|should)\b/i.test(transcription)}`);
    console.log(`Has Speaker labels: ${transcription.includes('Speaker 1:') || transcription.includes('Speaker 2:')}`);
    console.log(`=== TRANSCRIPTION PROCESS END ===\n`);
    
    return transcription;
  } catch (error) {
    console.error("❌ Error during audio transcription:", error);
    throw new Error("Failed to transcribe audio.");
  }
}

/**
 * Translate text using Gemini API
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language code
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, sourceLanguage) {
  // If source is already English, return original text
  if (sourceLanguage === 'en') {
    console.log('Source language is English, skipping translation');
    return text;
  }

  const languageName = SUPPORTED_LANGUAGES.find(lang => lang.value === sourceLanguage)?.label || sourceLanguage;
  console.log(`\n=== TRANSLATION PROCESS START ===`);
  console.log(`Source Language: ${languageName} (${sourceLanguage})`);
  console.log(`Original text length: ${text.length}`);
  console.log(`Original text: "${text.substring(0, 300)}..."`);
  
  // More explicit English-only translation prompt
  const prompt = `You are a professional translator. Your task is to translate the following ${languageName} text into ENGLISH ONLY.

RULES:
1. Output must be in English language only
2. Keep speaker labels (Speaker 1:, Speaker 2:) unchanged
3. Translate all spoken content to English
4. Do not include any ${languageName} words in your response
5. Use natural English expressions

Input text in ${languageName}:
${text}

Output in English:`;

  try {
    const response = await executeWithRetry(async (ai) => {
      const model = ai.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1, // Very low temperature for consistent translation
          maxOutputTokens: 8192,
          topP: 0.8,
          topK: 40
        }
      });
      return await model.generateContent(prompt);
    });
    
    let translatedText = response.response.text().trim();
    
    // Clean up common translation artifacts
    translatedText = translatedText.replace(/^(Here is the translation:|Translation:|English translation:)/i, '').trim();
    translatedText = translatedText.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    
    console.log(`Translated text length: ${translatedText.length}`);
    console.log(`Translated text: "${translatedText.substring(0, 300)}..."`);
    
    // Validate that translation actually happened and is in English
    const isSame = translatedText.toLowerCase() === text.toLowerCase();
    const hasEnglishWords = /\b(the|and|is|are|was|were|have|has|will|would|could|should|a|an|in|on|at|to|for|of|with|by)\b/i.test(translatedText);
    const hasOriginalLanguageChars = sourceLanguage === 'hi' ? /[\u0900-\u097F]/.test(translatedText) :
                                     sourceLanguage === 'ta' ? /[\u0B80-\u0BFF]/.test(translatedText) :
                                     sourceLanguage === 'kn' ? /[\u0C80-\u0CFF]/.test(translatedText) :
                                     sourceLanguage === 'ml' ? /[\u0D00-\u0D7F]/.test(translatedText) : false;
    
    console.log(`Translation validation:`);
    console.log(`- Is same as original: ${isSame}`);
    console.log(`- Contains English words: ${hasEnglishWords}`);
    console.log(`- Contains original language characters: ${hasOriginalLanguageChars}`);
    console.log(`- Has Speaker labels: ${translatedText.includes('Speaker 1:') || translatedText.includes('Speaker 2:')}`);
    
    // If translation failed or still contains original language, try a simpler approach
    if (isSame || hasOriginalLanguageChars || !hasEnglishWords) {
      console.warn('⚠️  Translation appears to have failed, trying simpler approach...');
      
      const simplePrompt = `Translate to English:\n\n${text}`;
      
      try {
        const retryResponse = await executeWithRetry(async (ai) => {
          const model = ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 8192
            }
          });
          return await model.generateContent(simplePrompt);
        });
        
        const retryTranslation = retryResponse.response.text().trim();
        const retryHasEnglish = /\b(the|and|is|are|was|were|have|has|will|would|could|should|a|an|in|on|at|to|for|of|with|by)\b/i.test(retryTranslation);
        
        if (retryHasEnglish && retryTranslation !== text) {
          console.log('✅ Retry translation successful');
          translatedText = retryTranslation;
        } else {
          console.log('❌ Retry also failed, using fallback');
          // Create a clear English fallback
          translatedText = `[ENGLISH TRANSLATION NEEDED] ${text.replace(/[^\w\s:]/g, ' ').replace(/\s+/g, ' ')}`;
        }
      } catch (retryError) {
        console.error('Retry translation failed:', retryError);
        translatedText = `[ENGLISH TRANSLATION NEEDED] ${text.replace(/[^\w\s:]/g, ' ').replace(/\s+/g, ' ')}`;
      }
    }
    
    console.log(`=== TRANSLATION PROCESS END ===\n`);
    return translatedText;
    
  } catch (error) {
    console.error("❌ Error during translation:", error);
    throw new Error(`Failed to translate text from ${languageName} to English: ${error.message}`);
  }
}

/**
 * Perform comprehensive analysis using Gemini API
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Analysis result
 */
export async function performComprehensiveAnalysis(text) {
  const prompt = `Analyze the following customer support call transcript. Infer who is the customer and who is the agent.

Provide the following in JSON format:
1.  **customerSentiment**: An object containing:
    - sentiment: The customer's overall sentiment (POSITIVE, NEGATIVE, or NEUTRAL).
    - score: A sentiment score from -1 to 1.
    - justification: A brief justification for the customer's sentiment.
2.  **agentSentiment**: An object containing 4 detailed aspects:
    - **positive**: Agent's positive attitude and demeanor
      - sentiment: POSITIVE, NEGATIVE, or NEUTRAL
      - score: A sentiment score from -1 to 1
      - justification: Analysis of agent's positive attitude, friendliness, and enthusiasm
    - **callOpening**: Agent's performance during call opening
      - sentiment: POSITIVE, NEGATIVE, or NEUTRAL  
      - score: A sentiment score from -1 to 1
      - justification: Analysis of greeting, introduction, and initial rapport building
    - **callQuality**: Agent's overall call handling quality
      - sentiment: POSITIVE, NEGATIVE, or NEUTRAL
      - score: A sentiment score from -1 to 1
      - justification: Analysis of problem-solving, knowledge, and communication effectiveness
    - **callClosing**: Agent's performance during call closing
      - sentiment: POSITIVE, NEGATIVE, or NEUTRAL
      - score: A sentiment score from -1 to 1
      - justification: Analysis of resolution confirmation, next steps, and professional closure
3.  **summary**: A concise summary of the call, outlining the customer's issue, the agent's actions, and the final outcome.
4.  **agentCoaching**: Actionable coaching feedback for the agent. Analyze performance (tone, politeness, problem-solving) and offer specific advice on what they did well and areas for improvement.

Text: "${text}"`;

  try {
    const response = await executeWithRetry(async (ai) => {
      const model = ai.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              customerSentiment: {
                type: SchemaType.OBJECT,
                properties: {
                  sentiment: { type: SchemaType.STRING, description: "The customer's sentiment: POSITIVE, NEGATIVE, or NEUTRAL." },
                  score: { type: SchemaType.NUMBER, description: "The customer's sentiment score from -1 to 1." },
                  justification: { type: SchemaType.STRING, description: "Justification for the customer's sentiment." }
                },
                required: ["sentiment", "score", "justification"]
              },
              agentSentiment: {
                type: SchemaType.OBJECT,
                properties: {
                  positive: {
                    type: SchemaType.OBJECT,
                    properties: {
                      sentiment: { type: SchemaType.STRING, description: "Agent's positive attitude sentiment: POSITIVE, NEGATIVE, or NEUTRAL." },
                      score: { type: SchemaType.NUMBER, description: "Agent's positive attitude score from -1 to 1." },
                      justification: { type: SchemaType.STRING, description: "Analysis of agent's positive attitude, friendliness, and enthusiasm." }
                    },
                    required: ["sentiment", "score", "justification"]
                  },
                  callOpening: {
                    type: SchemaType.OBJECT,
                    properties: {
                      sentiment: { type: SchemaType.STRING, description: "Call opening performance sentiment: POSITIVE, NEGATIVE, or NEUTRAL." },
                      score: { type: SchemaType.NUMBER, description: "Call opening performance score from -1 to 1." },
                      justification: { type: SchemaType.STRING, description: "Analysis of greeting, introduction, and initial rapport building." }
                    },
                    required: ["sentiment", "score", "justification"]
                  },
                  callQuality: {
                    type: SchemaType.OBJECT,
                    properties: {
                      sentiment: { type: SchemaType.STRING, description: "Call quality sentiment: POSITIVE, NEGATIVE, or NEUTRAL." },
                      score: { type: SchemaType.NUMBER, description: "Call quality score from -1 to 1." },
                      justification: { type: SchemaType.STRING, description: "Analysis of problem-solving, knowledge, and communication effectiveness." }
                    },
                    required: ["sentiment", "score", "justification"]
                  },
                  callClosing: {
                    type: SchemaType.OBJECT,
                    properties: {
                      sentiment: { type: SchemaType.STRING, description: "Call closing performance sentiment: POSITIVE, NEGATIVE, or NEUTRAL." },
                      score: { type: SchemaType.NUMBER, description: "Call closing performance score from -1 to 1." },
                      justification: { type: SchemaType.STRING, description: "Analysis of resolution confirmation, next steps, and professional closure." }
                    },
                    required: ["sentiment", "score", "justification"]
                  }
                },
                required: ["positive", "callOpening", "callQuality", "callClosing"]
              },
              summary: {
                type: SchemaType.STRING,
                description: "A concise summary of the call."
              },
              agentCoaching: {
                type: SchemaType.STRING,
                description: "Actionable coaching feedback for the agent."
              }
            },
            required: ["customerSentiment", "agentSentiment", "summary", "agentCoaching"]
          }
        }
      });
      return await model.generateContent(prompt);
    });

    const jsonString = response.response.text();
    const result = JSON.parse(jsonString);

    // Validate sentiments
    const validateSentiment = (sentimentObj, party) => {
      if (!sentimentObj) throw new Error(`${party} sentiment data is missing.`);
      const sentiment = sentimentObj.sentiment?.toUpperCase();
      if (!['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(sentiment)) {
        throw new Error(`Invalid sentiment value received for ${party}: ${sentimentObj.sentiment}`);
      }
      return {
        ...sentimentObj,
        sentiment,
      };
    };

    // Validate agent sentiment structure
    const validateAgentSentiment = (agentSentimentObj) => {
      if (!agentSentimentObj) throw new Error("Agent sentiment data is missing.");
      
      const requiredAspects = ['positive', 'callOpening', 'callQuality', 'callClosing'];
      const validatedAgentSentiment = {};
      
      for (const aspect of requiredAspects) {
        if (!agentSentimentObj[aspect]) {
          throw new Error(`Agent sentiment aspect '${aspect}' is missing.`);
        }
        validatedAgentSentiment[aspect] = validateSentiment(agentSentimentObj[aspect], `Agent ${aspect}`);
      }
      
      return validatedAgentSentiment;
    };

    return {
      customerSentiment: validateSentiment(result.customerSentiment, "Customer"),
      agentSentiment: validateAgentSentiment(result.agentSentiment),
      summary: result.summary,
      agentCoaching: result.agentCoaching
    };
  } catch (error) {
    console.error("Error during comprehensive analysis:", error);
    throw new Error("Failed to perform comprehensive analysis.");
  }
}

/**
 * Extract keywords using Gemini API
 * @param {string} text - Text to extract keywords from
 * @returns {Promise<Object>} Keywords result
 */
export async function extractKeywords(text) {
  const prompt = `Extract a list of important keywords and key phrases from the following text. Consider terms related to customer service, products, and user sentiment. Text: "${text}"`;
  
  try {
    const response = await executeWithRetry(async (ai) => {
      const model = ai.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              keywords: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.STRING
                },
                description: 'An array of important keywords and phrases.'
              }
            },
            required: ["keywords"]
          }
        }
      });
      return await model.generateContent(prompt);
    });
    
    const jsonString = response.response.text();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error during keyword extraction:", error);
    throw new Error("Failed to extract keywords.");
  }
}
