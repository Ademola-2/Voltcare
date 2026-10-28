export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "VoltCare AI is not configured yet. Please check the GEMINI_API_KEY environment variable in Vercel." });
  }

  try {
    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = incoming
      .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
      .slice(-12)
      .map((item) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content.trim().slice(0, 1500) }] }))
      .filter((item) => item.parts[0].text);

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Please enter a question first." });
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are VoltCare AI, an educational assistant for electrical engineering, energy use, solar PV planning, batteries, inverters, and the VoltCare Learning Centre. Explain clearly and step by step, define units, show calculations when useful, and state assumptions. Do not claim estimates are certified designs. For electrical faults, prioritize safety: never instruct users to touch live conductors, bypass protective devices, or work on energized equipment; recommend isolating power where safe and contacting a qualified electrician for dangerous or uncertain situations. Be honest about uncertainty and ask clarifying questions when needed." }] },
        contents: messages,
        generationConfig: { temperature: 0.4, maxOutputTokens: 900 }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Gemini API error:", response.status, data?.error?.message || "Unknown error");
      if (response.status === 429) return res.status(429).json({ error: "VoltCare AI is receiving too many requests or has reached its usage limit. Please try again later." });
      if (response.status === 400 || response.status === 403) return res.status(502).json({ error: "Gemini could not process this request. Check the API key, model access, and Google AI Studio usage limits." });
      return res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again shortly." });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!reply) return res.status(502).json({ error: "The assistant returned an empty response. Please try again." });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("VoltCare AI request failed:", error?.message || error);
    return res.status(500).json({ error: "Something went wrong while contacting VoltCare AI. Please try again." });
  }
}
