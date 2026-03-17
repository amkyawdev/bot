export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // 🧪 Debug: API Key Check
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: "GROQ_API_KEY missing ❌"
      }), { headers });
    }

    // 🌐 Health
    if (path === "/api/health") {
      return new Response(JSON.stringify({
        success: true,
        data: { status: "OK 🚀" }
      }), { headers });
    }

    // 💬 Chat API
    if (path === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message;

        if (!message) {
          return new Response(JSON.stringify({
            success: false,
            error: "Message required"
          }), { headers });
        }

        const res = await fetch("https://api.groq.com/openai/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            input: message
          })
        });

        const data = await res.json();

        // 🔥 SAFE RESPONSE PARSE
        let reply =
          data.output_text ||
          data.output?.[0]?.content?.[0]?.text ||
          data.choices?.[0]?.message?.content ||
          "No response 🤖";

        return new Response(JSON.stringify({
          success: true,
          data: { reply }
        }), { headers });

      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err.message
        }), { headers });
      }
    }

    // ❌ Not found
    return new Response(JSON.stringify({
      success: false,
      error: "Route not found"
    }), { status: 404, headers });
  }
};
