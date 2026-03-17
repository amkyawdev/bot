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

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // 🌐 Health Check
    if (path === "/api/health") {
      return new Response(JSON.stringify({
        success: true,
        data: { status: "OK 🚀" }
      }), { headers });
    }

    // 💬 Chat
    if (path === "/api/chat" && request.method === "POST") {
      try {
        const { message } = await request.json();

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

        let reply =
          data.output_text ||
          data.output?.[0]?.content?.[0]?.text ||
          "No response";

        return new Response(JSON.stringify({
          success: true,
          data: { reply }
        }), { headers });

      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          error: err.message
        }), { status: 500, headers });
      }
    }

    // ❌ Not Found
    return new Response(JSON.stringify({
      success: false,
      error: "Route not found"
    }), { status: 404, headers });
  }
};
