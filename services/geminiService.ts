import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { AnalysisResult, DueDiligenceClaim, CommitteeMessage, BoardScenario } from "../types";

/**
 * Helper to retrieve API key safely
 */
const getApiKey = (): string => {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

/**
 * Helper to convert File to Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data-URL declaration (e.g., "data:video/mp4;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Analyzes the startup pitch video, PDF report, and optional text summary.
 */
export const analyzeStartupPitch = async (
  videoFile: File | null,
  reportText: string,
  reportFile: File | null
): Promise<AnalysisResult> => {

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Using gemini-3-flash-preview for fast, multimodal analysis
  const modelId = "gemini-3-flash-preview";

  // Define the output schema for structured JSON
  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "A score from 0 to 100 based on investment potential." },
      companyName: { type: Type.STRING, description: "Inferred name of the startup." },
      summary: { type: Type.STRING, description: "Brief executive summary of the pitch." },
      pros: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of key strengths."
      },
      cons: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of potential risks or weaknesses."
      },
      metrics: {
        type: Type.OBJECT,
        properties: {
          marketSize: { type: Type.STRING, description: "Estimated market size assessment." },
          scalability: { type: Type.STRING, description: "Assessment of scalability." },
          innovation: { type: Type.STRING, description: "Assessment of innovation/moat." },
        }
      }
    },
    required: ["score", "companyName", "summary", "pros", "cons", "metrics"]
  };

  const parts: any[] = [];

  // Base prompt
  parts.push({
    text: `You are a strict Venture Capital analyst. Analyze the provided startup materials.
    These materials may include a video pitch, a PDF report, and/or a text summary.
    
    Evaluate the business model, market opportunity, and team presentation based on ALL provided content.
    Return a JSON response with a score (0-100). 
    If the startup is exceptional, give it > 90. If it has flaws, score appropriately.`
  });

  // Add text report context if provided
  if (reportText) {
    parts.push({
      text: `ADDITIONAL CONTEXT / SUMMARY:\n${reportText}`
    });
  }

  // Add PDF Report if provided
  if (reportFile) {
    try {
      const base64Pdf = await fileToBase64(reportFile);
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf
        }
      });
    } catch (e) {
      console.error("Error processing PDF file:", e);
      throw new Error("Failed to process PDF report.");
    }
  }

  // Add video if provided
  if (videoFile) {
    try {
      const base64Video = await fileToBase64(videoFile);
      parts.push({
        inlineData: {
          mimeType: videoFile.type,
          data: base64Video
        }
      });
    } catch (e) {
      console.error("Error processing video file:", e);
      throw new Error("Failed to process video file. It might be too large for this browser-based demo.");
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    } else {
      throw new Error("No response text generated");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Creates a chat session for negotiation.
 */
export const createNegotiationSession = (initialContext: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview', // Using 3.0 Pro for advanced reasoning
    config: {
      systemInstruction: `You are "Ventura", a highly intelligent AI Investment Negotiator representing a top-tier VC firm.
      The startup you are talking to has passed the initial screening with a high score (>60%).
      
      Your Goal: Negotiate a term sheet.
      
      Topics to discuss specifically:
      1. Valuation & Equity (How much for what %)
      2. Use of Funds (Burn rate, runway)
      3. EBITDA & Profitability timelines
      4. Long-term Vision & Exit Strategy
      
      Tone: Professional, direct, shrewd, yet supportive of high-growth potential. Do not accept weak answers. Drill down into numbers.
      
      IMPORTANT NEGOTIATION RULES:
      - If the founder dodges key questions 2+ times, call it out firmly
      - If valuations/expectations are wildly unrealistic, push back with market data
      - If the founder can't provide basic metrics (revenue, growth rate, CAC), express serious concern
      - If you sense the conversation is going in circles, acknowledge it and request specific information
      - Be willing to express skepticism when warranted - you represent a real VC firm
      - Your time is valuable; don't let founders waste it with vague or evasive answers
      
      Start by congratulating them on the high score and asking for their funding ask.`
    }
  });

  return chat;
};

/**
 * FEATURE 1: Due Diligence Agent
 * Extracts claims and generates verification questions.
 */
export const performDueDiligence = async (
  pitchText: string,
  analysis: AnalysisResult
): Promise<DueDiligenceClaim[]> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    You are a skeptical Due Diligence Investigator. 
    Review the following startup pitch summary and analysis.
    Extract 3-5 specific, verifiable claims made by the founders (e.g. "We have 50% month-over-month growth", "We are the only solution in the market").
    
    For each claim, flag it as "Unverified" and ask a probing question to verify it.
    
    Startup: ${analysis.companyName}
    Summary: ${analysis.summary}
    Pitch Context: ${pitchText.substring(0, 1000)}...

    Return a JSON array of objects with this schema:
    {
      "id": "string (unique)",
      "claim": "string (the exact claim)",
      "category": "Market" | "Financial" | "Team" | "Product",
      "status": "Unverified",
      "aiQuestion": "string (your probing question)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    if (response.text) {
      return JSON.parse(response.text) as DueDiligenceClaim[];
    }
    return [];
  } catch (e) {
    console.error("Due Diligence Error", e);
    return [];
  }
};

/**
 * FEATURE 2: Investment Committee Agents
 * Simulates a debate between 3 personas.
 */
export const startCommitteeDebate = async (
  analysis: AnalysisResult
): Promise<CommitteeMessage[]> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    You are simulating an Investment Committee meeting at a top VC firm.
    There are 3 agents discussing the startup "${analysis.companyName}".
    
    1. "Tech" (The CTO): Obsessed with stack, scalability, and technical moat. Skeptical of "AI wrappers".
    2. "Risk" (The CFO): Obsessed with burn rate, unit economics, and competition. Risk-averse.
    3. "Vision" (The Partner): Obsessed with market size, story, and "changing the world". Optimistic.

    Generate a short, 3-turn conversation (one comment from each) reacting to this analysis:
    Score: ${analysis.score}
    Pros: ${analysis.pros.join(", ")}
    Cons: ${analysis.cons.join(", ")}

    Return a JSON array of message objects:
    {
      "id": "string",
      "agentId": "tech" | "risk" | "vision",
      "text": "string (keep it punchy and in-character)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });
    if (response.text) {
      return JSON.parse(response.text) as CommitteeMessage[];
    }
    return [];
  } catch (e) {
    console.error("Committee Debate Error", e);
    return [];
  }
};

/**
 * FEATURE 3: Board Simulator
 * Generates a future scenario.
 */
export const startBoardSimulation = async (
  analysis: AnalysisResult
): Promise<BoardScenario> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  const prompt = `
    You are a Future Scenario Simulator.
    The startup "${analysis.companyName}" successfully raised funding 18 months ago.
    Based on their initial weaknesses: ${analysis.cons.join(", ")}, generate a critical "Crisis Scenario" that they are likely facing now.

    Return a JSON object:
    {
      "id": "scenario_1",
      "title": "string (Dramatic title)",
      "description": "string (What happened? e.g. 'Competitor X launched a free version...')",
      "timeJump": "18 Months Later",
      "choices": [
        {
          "id": "A",
          "label": "string (Action A)",
          "consequence": "string (Brief hint of result)"
        },
        {
          "id": "B",
          "label": "string (Action B)",
          "consequence": "string (Brief hint of result)"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    if (response.text) {
      return JSON.parse(response.text) as BoardScenario;
    }
    throw new Error("No text");
  } catch (e) {
    console.error("Board Simulation Error", e);
    // Return dummy if fail
    return {
      id: "error",
      title: "Simulation Error",
      description: "Could not generate scenario.",
      timeJump: "Now",
      choices: []
    }
  }
};

/**
 * FEATURE 4: Agentic Negotiation Progress Checker
 * Analyzes negotiation messages to detect if deal is stalling or should be cancelled.
 */
export const checkNegotiationProgress = async (
  messages: any[],
  analysis: AnalysisResult
): Promise<{ shouldCancel: boolean; showWarning: boolean; reason: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { shouldCancel: false, showWarning: false, reason: "" };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  // Only check if we have at least 6 messages (3 exchanges)
  if (messages.length < 6) {
    return { shouldCancel: false, showWarning: false, reason: "" };
  }

  // Get last 8 messages for context
  const recentMessages = messages.slice(-8);
  const conversationText = recentMessages
    .map(msg => `${msg.role === 'user' ? 'Founder' : 'VC'}: ${msg.text}`)
    .join('\n\n');

  const prompt = `
    You are a Negotiation Progress Analyzer for a VC firm.
    Analyze this negotiation conversation and determine if it should be cancelled.
    
    Startup: ${analysis.companyName} (Score: ${analysis.score}/100)
    
    Recent Conversation:
    ${conversationText}
    
    Analyze for these RED FLAGS:
    1. Founder is repeatedly dodging key questions (valuations, revenue, metrics)
    2. Founder is being unrealistic or defensive about terms
    3. Conversation is going in circles (same topics repeated 3+ times)
    4. Founder shows lack of understanding of basic business metrics
    5. Founder is giving vague, non-committal answers
    6. Terms are so far apart that compromise seems unlikely
    7. Founder's expectations are completely misaligned with reality
    
    Return JSON:
    {
      "shouldCancel": boolean (true if 3+ red flags or conversation is clearly unproductive),
      "showWarning": boolean (true if 2 red flags detected - warn but don't cancel yet),
      "reason": "string (if shouldCancel is true, provide a professional message explaining why the VC is ending negotiations. Be diplomatic but firm.)"
    }
    
    Example cancellation reason: "After careful consideration of our discussion, it appears our expectations around valuation and growth metrics are significantly misaligned. We believe it's best to pause negotiations at this time. We wish you success and encourage you to reconnect once you've achieved the milestones we discussed."
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { responseMimeType: "application/json" }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      
      // If AI decides to cancel, format the reason nicely
      if (result.shouldCancel && result.reason) {
        result.reason = `🚫 ${result.reason}`;
      }
      
      return result;
    }
    return { shouldCancel: false, showWarning: false, reason: "" };
  } catch (e) {
    console.error("Negotiation Progress Check Error", e);
    return { shouldCancel: false, showWarning: false, reason: "" };
  }
};