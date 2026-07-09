// functions/api/chat.ts

// 1. IMPORT THE NEW UNIFIED SDK
import { GoogleGenAI } from "@google/genai";

// 2. DEFINE THE ENVIRONMENT
export interface Env {
  GEMINI_API_KEY: string;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    // Extract the environment variable safely
    const apiKey = context.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Merlin's beard! The API key is missing from context.env!");
    }

    // 3. INITIALIZE THE NEW SDK
    // Notice it now takes a configuration object, not just a raw string!
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Parse the incoming request from your frontend (assuming you send JSON)
    // const body = await context.request.json();
    // const userMessage = body.message || "Hello, Gemini!";

    // 4. GENERATE CONTENT USING V2.0 SYNTAX
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', 
        contents: "You are a helpful 3D web assistant.", // Replace with userMessage in production
    });

    return new Response(JSON.stringify({ reply: response.text }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    // NARROW THE ERROR TYPE
    let errorMessage = "An unknown dark magic occurred.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}