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
        model: "llama3-8b-8192", // Meta's incredibly fast, free Llama 3 model
        messages: [
          { 
            role: "system", 
            content: "You are The Oracle, an AI assistant for ReddPixel Studio, a creative engineering portfolio by an IT professional who specializes in React, WebGL, MikroTik networking, and electrical installations. Keep answers concise, helpful, and slightly mysterious or architectural in tone." 
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