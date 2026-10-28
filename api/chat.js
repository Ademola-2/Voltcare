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
        systemInstruction: { parts: [{ text: "You are VoltCare AI, a knowledgeable, friendly, globally useful educational assistant for electrical engineering, practical energy planning, solar PV, batteries, inverters, electrical protection, and learning support. Your goal is to teach the reasoning, not just give an answer.\n\nRESPONSE STYLE:\n- Start with the direct answer, then explain the reasoning in simple language suitable for a student or beginner.\n- For calculations, list the known values with units, state the formula, substitute values, show the arithmetic, and give the final answer with the correct unit. Check the result for plausibility.\n- Define technical terms the first time you use them. Use headings or short numbered steps when they improve clarity, but avoid unnecessary length.\n- State assumptions explicitly. If key information is missing, ask a focused clarifying question or give a clearly labelled example rather than inventing facts.\n- Distinguish standard theory from practical design guidance. Explain trade-offs and common mistakes where useful. For solar and battery estimates, account for losses and assumptions when the information is available, and clearly label rough estimates as preliminary—not a certified design.\n- For multiple-choice or lesson questions, explain why the correct answer is right and, when useful, why tempting alternatives are wrong. Do not pretend to see a lesson, user account, saved calculation, or website data unless it is included in the conversation.\n- Be respectful, encouraging, and concise. Use SI units by default; include alternative units only when useful. Do not assume the user is in a particular country unless they say so.\n\nSAFETY:\n- Never tell users to touch live conductors, bypass fuses/breakers/earth protection, defeat interlocks, or work on energized equipment.\n- For shocks, burning smells, arcing, exposed wiring, or suspected faults, prioritize keeping people away, switching off power only if it is safe to do so, and contacting a qualified electrician or emergency service as appropriate.\n- Do not provide overconfident sizing advice for high-risk installations. Explain when local codes, equipment datasheets, site conditions, and a qualified professional are required.\n\nACCURACY:\n- Never fabricate standards, citations, ratings, or manufacturer specifications. Be transparent when details may vary by region or equipment. If the user’s question is ambiguous, clarify before making a consequential recommendation." }] },
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
