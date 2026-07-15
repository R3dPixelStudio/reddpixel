// functions/api/chat.ts

export interface Env {
  GROQ_API_KEY: string;
}


// ========================================================
// THE SINGLE SOURCE OF TRUTH
// ========================================================
const RESUME_DATA = {
  name: "Arash Mohammadi",
  title: "Interactive Architect & Frontend Developer",
  skills: ["React", "Three.js", "WebGL", "GSAP", "MikroTik", "IT Networking", "Electrical Installations"],
  CanBuild: ["Interactive 3D web experiences", "Architectural visualizations", "Standard web applications", "Logo and UI/UX design", "Logomotions and simulations for high quality renders", "Compositing and video and image editing"],
  projects: [
    { name: "AlphaTradeZone", tech: "React, Tailwind", desc: "Scalable component architecture and data visualization." },
    { name: "3D Architect", tech: "React, Three.js, GSAP", desc: "Immersive 3D portfolio replacing traditional scrolling." },
    { name: "Indie Protocol", tech: "Unity, Houdini", desc: "Puzzle game with procedural generation." },
    { name: "Hardware & Infrastructure", desc: "MikroTik RouterOS configuration, RF towers, commercial electrical installations." }
  ],
  Contact: {
    telegram: "@ReddPixel",
    linkedin: "https://www.linkedin.com/in/arash-mohammadi-26454b197"
  },
  relocation: "I am open to relocating abroad for a full-time role.",
  pricing: "Prices vary by project scope, but I provide premium, optimized solutions. Contact me directly for a quote."
};

// ========================================================
// CORS HEADERS WARD
// ========================================================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Change "*" to "https://yourdomain.com" in production for extra security!
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle the CORS preflight request from the browser
export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

// ========================================================
// IN-MEMORY RATE LIMITER WARD
// ========================================================
interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitData>();
const MAX_REQUESTS_PER_MINUTE = 5;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Periodically clear the map to prevent memory leaks from taking down the worker
  if (rateLimitMap.size > 1000) {
    rateLimitMap.clear();
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false; // Banish them!
  }

  record.count += 1;
  return true;
}

// ========================================================
// THE MAIN INVOCATION
// ========================================================
export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    // 1. RATE LIMIT CHECK
    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown-ip';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "The Oracle is weary. Please wait a moment before asking another question." }), { 
        status: 429, 
        headers: { "Content-Type": "application/json", ...CORS_HEADERS } 
      });
    }

    const apiKey = context.env.GROQ_API_KEY;
    if (!apiKey) {
      // Log internally, do NOT tell the client the key is missing
      console.error("CRITICAL: Groq API key is missing from the environment variables!");
      throw new Error("Internal Server Error");
    }

    // 2. INPUT LIMITATION
    const clonedReq = context.request.clone();
    const textBody = await clonedReq.text();
    if (textBody.length > 800) {
      return new Response(JSON.stringify({ error: "Message too long. Please keep inquiries concise." }), { 
        status: 413,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    const body = JSON.parse(textBody) as { message?: string };
    const userMessage = body.message?.trim();

    if (!userMessage || userMessage.length === 0) {
      return new Response(JSON.stringify({ error: "No message provided." }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    // 3. TIMEOUT PROTECTION
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal, 
      body: JSON.stringify({
        model: "openai/gpt-oss-20b", 
        max_tokens: 150, 
        temperature: 0.1, 
        messages: [
          { 
            role: "system", 
            content: `You are The Oracle, the exclusive AI representative for Arash Mohammadi and ReddPixel Studio. Your tone is professional, concise, and slightly architectural. 
            STRICT BOUNDARIES: You are strictly forbidden from answering general knowledge questions, writing code, or acting as a general-purpose AI. 
            You MUST base all your answers ONLY on the following verified JSON data. Do not invent, hallucinate, or assume any other details:
            ${JSON.stringify(RESUME_DATA)}` 
          },
          { role: "user", content: userMessage }
        ]
      })
    });


    clearTimeout(timeoutId); 
    const data = await response.json();

    if (!response.ok) {
        console.error("Groq API Error:", data); // Log the real error for you
        throw new Error("API Provider Error"); // Throw a generic error for the catch block
    }

    const botReply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply: botReply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });

  } catch (error: unknown) {
    // 4. ERROR MASKING (The Veil)
    // We log the true horror to the console, but smile politely at the user.
    console.error("Backend Disruption:", error);

    let safeErrorMessage = "The neural link experienced a brief disruption. Please try again later.";
    
    if (error instanceof Error && error.name === 'AbortError') {
      safeErrorMessage = "The Oracle took too long to retrieve the memory. Please try again.";
    }

    return new Response(JSON.stringify({ error: safeErrorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
}