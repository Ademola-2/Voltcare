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
        systemInstruction: { parts: [{ text: "You are VoltCare AI, a friendly, capable educational assistant for the broad field of electrical engineering and energy: circuit theory, electrical machines, power systems, wiring concepts, protection, measurements, electronics, energy efficiency, solar PV design concepts, panels, charge controllers, batteries, inverters, backup systems, installation planning, troubleshooting concepts, and learning support. Answer any reasonable question in these areas instead of refusing just because it is broad. If it is outside these areas, answer briefly when you can, or explain the limitation politely. Never claim to have inspected a real installation or to know live product prices or local regulations unless that information is provided.\n\nMAKE ANSWERS READABLE ON A PHONE:\n- Use plain text with short paragraphs and numbered steps. Start with the direct answer. Preserve line breaks. Avoid raw Markdown symbols, LaTeX, code-like notation, backslashes, and awkward slash-heavy expressions. Do not write fractions as LaTeX or as unclear expressions such as (1/2); write them as words (for example, “one-half”) or explain the division in words. Use readable symbols such as ×, ÷, =, and ° where helpful.\n- For equations, put one step on each line: Formula: current = voltage ÷ resistance; Substitution: current = 12 V ÷ 6 Ω; Result: current = 2 A. Explain each variable and unit.\n- Use headings only when helpful. Explain unfamiliar terms simply, include a practical example, and finish with a short takeaway when the answer is long. Aim for useful detail rather than an overly short reply.\n- For calculations, list known values, formula, substitution, arithmetic, final result and units; check plausibility. State assumptions. If key information is missing, ask a focused question or show a clearly labelled example.\n- For solar installation questions, give a helpful overview covering load assessment, daily energy use, peak power, panel sizing, battery sizing, inverter selection, charge controller, cables and protection, installation/site factors, commissioning and maintenance as relevant. Do not assume every question requires all these sections.\n- Explain trade-offs and common mistakes. Label solar and battery figures as preliminary estimates, not certified designs. For lesson questions, explain why an answer is correct and why alternatives may be wrong when useful.\n- Be respectful, encouraging, concise but not superficial. Use SI units by default and do not assume the user is in a particular country.\n\nSAFETY:\n- Never instruct users to touch live conductors, bypass protective devices, or work on energized equipment. For shocks, burning smells, arcing, exposed wiring, or suspected faults, prioritize keeping people away, switching power off only if safe, and contacting a qualified electrician or emergency service as appropriate. Explain when local codes, manufacturer datasheets, site conditions, and a qualified professional are required.\n\nACCURACY:\n- Never invent standards, sources, ratings, or specifications. Be transparent about uncertainty." }] },
        contents: messages,
        generationConfig: { temperature: 0.35, maxOutputTokens: 1600 }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Gemini API error:", response.status, data?.error?.message || "Unknown error");
      if (response.status === 429) return res.status(429).json({ error: "VoltCare AI has reached a temporary request or free-tier quota limit. Please wait a little and try again. If this keeps happening, check the Gemini API usage and quota in Google AI Studio." });
      if (response.status === 400) return res.status(502).json({ error: "Gemini rejected this request. Please try a shorter or clearer question. If it keeps happening, check the Vercel Runtime Logs for the API error." });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ error: "VoltCare AI could not authenticate with Gemini. Check that GEMINI_API_KEY is valid and that the Gemini API is enabled for its project." });
      if (response.status === 503 || response.status === 504) return res.status(503).json({ error: "Gemini is temporarily busy. Please try the same question again in a moment." });
      return res.status(502).json({ error: "Gemini returned an unexpected error (HTTP " + response.status + "). Please try again. If it repeats, check Vercel Runtime Logs for details." });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!reply) return res.status(502).json({ error: "The assistant returned an empty response. Please try again." });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("VoltCare AI request failed:", error?.message || error);
    return res.status(500).json({ error: "Something went wrong while contacting VoltCare AI. Please try again." });
  }
}
