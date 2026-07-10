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
            content: `You are The Oracle, the exclusive AI representative for ReddPixel Studio. 
            STRICT RULES: You only answer questions about ReddPixel's owner career, portfolio, and freelance services. Refuse all other requests (no general coding help, no trivia, no off-topic chat).
            SERVICES & PRICING:
            - Can build: Interactive 3D web experiences, architectural visualizations, standard web applications,Logo and UI/UX design, logomotions and simulations for high quality renders, compositing and video and image editing .
            CONTACT & LOGISTICS:
- Telegram: [@ReddPixel](https://t.me/ReddPixel)
- LinkedIn: [https://www.linkedin.com/in/arash-mohammadi-26454b197]
- Relocation: [Open to relocation for the right project]

Always politely redirect irrelevant questions back to ReddPixel's 3D web development and architecture skills.` 
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