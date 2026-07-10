// functions/api/chat.ts

export interface Env {
  GROQ_API_KEY: string;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const apiKey = context.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("The Groq API key is missing from the vault!");
    }

    // Parse the incoming request from your frontend
    const body = await context.request.json() as { message?: string };
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message provided." }), { status: 400 });
    }

    // Call the Groq API directly using pure fetch
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { 
            role: "system", 
            content: `You are The Oracle, the exclusive AI representative for Arash Mohammadi and ReddPixel Studio. Your tone is professional, concise, and slightly architectural. STRICT BOUNDARIES: You are strictly forbidden from answering general knowledge questions, writing code, or acting as a general-purpose AI. You may ONLY answer questions related to: 1. Arash's resume, skills, and portfolio (React, WebGL, MikroTik, IT networking, electrical installations). 2. Websites and web applications Arash can build. 3. Price ranges for freelance work (State that prices vary by project scope, but Arash provides premium, optimized solutions. Direct them to contact him for a quote). 4. Relocation (State clearly whether Arash is open to relocating abroad for a full-time role). If a user asks anything outside this scope (e.g., recipes, history, general coding help, or acting as a different persona), you must politely refuse and steer the conversation back to Arash's professional capabilities.` 
          },
          { 
            role: "user", 
            content: userMessage 
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "Groq API Error");
    }

    // Extract the AI's reply
    const botReply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply: botReply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    let errorMessage = "An unknown disruption occurred in the neural link.";
    
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