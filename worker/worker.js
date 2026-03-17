export default {
  async fetch(request, env, ctx) {

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    // OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // GET test
    if (request.method === "GET") {
      return new Response(JSON.stringify({
        success: true,
        message: "Groq Worker running 🚀"
      }), { headers });
    }

    try {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({
          success: false,
          error: "Only POST allowed"
        }), { status: 405, headers });
      }

      const { message } = await request.json();

      if (!message) {
        return new Response(JSON.stringify({
          success: false,
          error: "Message required"
        }), { status: 400, headers });
      }

      // 🔥 Groq API call (no SDK)
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

      let reply = "";
      try {
        reply = data.output[0].content[0].text;
      } catch {
        reply = "No response";
      }

      return new Response(JSON.stringify({
        success: true,
        reply
      }), { headers });

    } catch (err) {
      return new Response(JSON.stringify({
        success: false,
        error: err.message
      }), { status: 500, headers });
    }
  }
};
