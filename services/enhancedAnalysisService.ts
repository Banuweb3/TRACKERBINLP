import { GoogleGenAI, Type } from "@google/genai";
import type { Language, ComprehensiveAnalysisResult } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';

// Use the same API key management from geminiService
const getEnvVariable = (name: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && typeof process.env === 'object') {
    return process.env[name];
  }
  return undefined;
};

const API_KEYS: string[] = [
  getEnvVariable('API_KEY'),
  getEnvVariable('API_KEY_2'),
  getEnvVariable('API_KEY_3'),
  getEnvVariable('API_KEY_4'),
  getEnvVariable('API_KEY_5'),
  getEnvVariable('API_KEY_6'),
  getEnvVariable('API_KEY_7'),
  getEnvVariable('API_KEY_8'),
  getEnvVariable('API_KEY_9'),
  getEnvVariable('API_KEY_10'),
].filter((key): key is string => !!key);

const UNIQUE_API_KEYS = [...new Set(API_KEYS)];

async function executeWithRetry<T>(
  generateContentCall: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  let lastError: unknown = null;

  for (let i = 0; i < UNIQUE_API_KEYS.length; i++) {
    const apiKey = UNIQUE_API_KEYS[i];
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await generateContentCall(ai);
      return result;
    } catch (error) {
      console.warn(`API call with key #${i + 1} failed. Retrying with the next key...`);
      lastError = error;
    }
  }

  console.error("All API keys failed.", lastError);
  throw lastError || new Error("All API keys have failed; please check your keys and quota.");
}

export interface CallOpeningAnalysis {
  greeting: {
    present: boolean;
    professional: boolean;
    warm: boolean;
    score: number;
  };
  introduction: {
    agentNameGiven: boolean;
    companyNameMentioned: boolean;
    purposeStated: boolean;
    score: number;
  };
  overallScore: number;
  feedback: string;
  improvements: string[];
}

export interface CallClosingAnalysis {
  summary: {
    issueRecapped: boolean;
    solutionConfirmed: boolean;
    score: number;
  };
  followUp: {
    nextStepsProvided: boolean;
    contactInfoGiven: boolean;
    satisfactionChecked: boolean;
    score: number;
  };
  closing: {
    politeClosing: boolean;
    thankYouExpressed: boolean;
    score: number;
  };
  overallScore: number;
  feedback: string;
  improvements: string[];
}

export interface SpeakingQualityAnalysis {
  tone: {
    professional: boolean;
    empathetic: boolean;
    confident: boolean;
    score: number;
  };
  communication: {
    clarity: number;
    pace: number;
    activeListening: boolean;
    score: number;
  };
  problemSolving: {
    understandingShown: boolean;
    solutionsOffered: boolean;
    followUpQuestions: boolean;
    score: number;
  };
  overallScore: number;
  feedback: string;
  improvements: string[];
}

export interface EnhancedAnalysisResult extends ComprehensiveAnalysisResult {
  callOpening: CallOpeningAnalysis;
  callClosing: CallClosingAnalysis;
  speakingQuality: SpeakingQualityAnalysis;
  overallCoachingScore: number;
  keywords?: string[];
  transcription?: string;
  translation?: string;
}

export interface BulkAnalysisProgress {
  fileId: string;
  fileName: string;
  status: 'pending' | 'transcribing' | 'translating' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result?: EnhancedAnalysisResult;
  error?: string;
}

export async function performEnhancedAnalysis(text: string): Promise<EnhancedAnalysisResult> {
  const prompt = `Analyze the following customer support call transcript comprehensively. Infer who is the customer and who is the agent.

Provide the following in JSON format:

1. **customerSentiment**: An object containing:
   - sentiment: The customer's overall sentiment (POSITIVE, NEGATIVE, or NEUTRAL)
   - score: A sentiment score from -1 to 1
   - justification: A brief justification for the customer's sentiment

2. **agentSentiment**: An object containing:
   - sentiment: The agent's overall sentiment (POSITIVE, NEGATIVE, or NEUTRAL)
   - score: A sentiment score from -1 to 1
   - justification: A brief justification for the agent's sentiment

3. **summary**: A concise summary of the call

4. **agentCoaching**: General coaching feedback for the agent

5. **callOpening**: Analysis of how the agent opened the call:
   - greeting: {present: boolean, professional: boolean, warm: boolean, score: 0-10}
   - introduction: {agentNameGiven: boolean, companyNameMentioned: boolean, purposeStated: boolean, score: 0-10}
   - overallScore: 0-10
   - feedback: string
   - improvements: string[]

6. **callClosing**: Analysis of how the agent closed the call:
   - summary: {issueRecapped: boolean, solutionConfirmed: boolean, score: 0-10}
   - followUp: {nextStepsProvided: boolean, contactInfoGiven: boolean, satisfactionChecked: boolean, score: 0-10}
   - closing: {politeClosing: boolean, thankYouExpressed: boolean, score: 0-10}
   - overallScore: 0-10
   - feedback: string
   - improvements: string[]

7. **speakingQuality**: Analysis of the agent's speaking quality:
   - tone: {professional: boolean, empathetic: boolean, confident: boolean, score: 0-10}
   - communication: {clarity: 0-10, pace: 0-10, activeListening: boolean, score: 0-10}
   - problemSolving: {understandingShown: boolean, solutionsOffered: boolean, followUpQuestions: boolean, score: 0-10}
   - overallScore: 0-10
   - feedback: string
   - improvements: string[]

8. **overallCoachingScore**: Overall coaching score from 0-10

Text: "${text}"`;

  try {
    const response = await executeWithRetry(async (ai) => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              customerSentiment: {
                type: Type.OBJECT,
                properties: {
                  sentiment: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  justification: { type: Type.STRING }
                },
                required: ["sentiment", "score", "justification"]
              },
              agentSentiment: {
                type: Type.OBJECT,
                properties: {
                  sentiment: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  justification: { type: Type.STRING }
                },
                required: ["sentiment", "score", "justification"]
              },
              summary: { type: Type.STRING },
              agentCoaching: { type: Type.STRING },
              callOpening: {
                type: Type.OBJECT,
                properties: {
                  greeting: {
                    type: Type.OBJECT,
                    properties: {
                      present: { type: Type.BOOLEAN },
                      professional: { type: Type.BOOLEAN },
                      warm: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["present", "professional", "warm", "score"]
                  },
                  introduction: {
                    type: Type.OBJECT,
                    properties: {
                      agentNameGiven: { type: Type.BOOLEAN },
                      companyNameMentioned: { type: Type.BOOLEAN },
                      purposeStated: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["agentNameGiven", "companyNameMentioned", "purposeStated", "score"]
                  },
                  overallScore: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["greeting", "introduction", "overallScore", "feedback", "improvements"]
              },
              callClosing: {
                type: Type.OBJECT,
                properties: {
                  summary: {
                    type: Type.OBJECT,
                    properties: {
                      issueRecapped: { type: Type.BOOLEAN },
                      solutionConfirmed: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["issueRecapped", "solutionConfirmed", "score"]
                  },
                  followUp: {
                    type: Type.OBJECT,
                    properties: {
                      nextStepsProvided: { type: Type.BOOLEAN },
                      contactInfoGiven: { type: Type.BOOLEAN },
                      satisfactionChecked: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["nextStepsProvided", "contactInfoGiven", "satisfactionChecked", "score"]
                  },
                  closing: {
                    type: Type.OBJECT,
                    properties: {
                      politeClosing: { type: Type.BOOLEAN },
                      thankYouExpressed: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["politeClosing", "thankYouExpressed", "score"]
                  },
                  overallScore: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["summary", "followUp", "closing", "overallScore", "feedback", "improvements"]
              },
              speakingQuality: {
                type: Type.OBJECT,
                properties: {
                  tone: {
                    type: Type.OBJECT,
                    properties: {
                      professional: { type: Type.BOOLEAN },
                      empathetic: { type: Type.BOOLEAN },
                      confident: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["professional", "empathetic", "confident", "score"]
                  },
                  communication: {
                    type: Type.OBJECT,
                    properties: {
                      clarity: { type: Type.NUMBER },
                      pace: { type: Type.NUMBER },
                      activeListening: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["clarity", "pace", "activeListening", "score"]
                  },
                  problemSolving: {
                    type: Type.OBJECT,
                    properties: {
                      understandingShown: { type: Type.BOOLEAN },
                      solutionsOffered: { type: Type.BOOLEAN },
                      followUpQuestions: { type: Type.BOOLEAN },
                      score: { type: Type.NUMBER }
                    },
                    required: ["understandingShown", "solutionsOffered", "followUpQuestions", "score"]
                  },
                  overallScore: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  improvements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["tone", "communication", "problemSolving", "overallScore", "feedback", "improvements"]
              },
              overallCoachingScore: { type: Type.NUMBER }
            },
            required: ["customerSentiment", "agentSentiment", "summary", "agentCoaching", "callOpening", "callClosing", "speakingQuality", "overallCoachingScore"]
          }
        }
      });
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    // Validate sentiments
    const validateSentiment = (sentimentObj: any, party: string) => {
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

    return {
      customerSentiment: validateSentiment(result.customerSentiment, "Customer"),
      agentSentiment: validateSentiment(result.agentSentiment, "Agent"),
      summary: result.summary,
      agentCoaching: result.agentCoaching,
      callOpening: result.callOpening,
      callClosing: result.callClosing,
      speakingQuality: result.speakingQuality,
      overallCoachingScore: result.overallCoachingScore
    };
  } catch (error) {
    console.error("Error during enhanced analysis:", error);
    throw new Error("Failed to perform enhanced analysis.");
  }
}
