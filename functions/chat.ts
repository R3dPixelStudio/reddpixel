// functions/api/chat.ts

// THE FIX: We explicitly define the shape of the Cloudflare 'context' object!
interface CloudflareContext {
  request: Request;
  env: {
    GEMINI_API_KEY: string;
  };
}

export async function onRequestPost(context: CloudflareContext) {
  const { request, env } = context;

  try {
    const body = await request.json() as { message?: string };
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message provided." }), { status: 400 });
    }

    // Securely call Gemini using the key locked in Cloudflare's vault
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: {
        role: "system",
        parts: [{ text: "You are The Oracle, an AI assistant for ReddPixel Studio, a creative engineering portfolio by an IT professional who specializes in React, WebGL, MikroTik networking, and electrical installations. Keep answers concise, helpful, and slightly mysterious or architectural in tone." }]
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        return new Response(JSON.stringify({ error: data.error?.message || "Gemini API Error" }), { status: 500 });
    }

    const botReply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "The Oracle is unreachable." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}