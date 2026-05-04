export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sideA, sideB, context, category } = req.body;
  if (!sideA || !sideB) return res.status(400).json({ error: 'Both sides are required' });

  const categoryToneMap = {
    "Relationship": "Consider romantic dynamics, emotional investment, and relationship norms.",
    "Money": "Focus on fairness, financial responsibility, and practical outcomes.",
    "Friendship": "Consider the social dynamics, loyalty, and long-term friendship health.",
    "Work": "Evaluate from a professional, workplace-appropriate perspective.",
    "Home & Chores": "Consider fairness, shared responsibility, and living-together harmony.",
    "Random & Petty": "Treat this with appropriate levity — it's petty, but still settle it decisively.",
  };

  const categoryGuidance = category && categoryToneMap[category] ? `\nCategory guidance: ${categoryToneMap[category]}` : "";

  const prompt = `You are an impartial argument settler. Analyze both sides objectively and deliver a clear, honest verdict. Be direct, witty, and fair.${categoryGuidance}

Settle this argument:
Side A: ${sideA}
Side B: ${sideB}${context ? `\nContext: ${context}` : ""}

Respond ONLY with a valid JSON object:
{
  "verdict": "1-2 sentence punchy verdict",
  "reasoning": "2-4 sentences of detailed reasoning",
  "winner": "sideA or sideB or both or neither",
  "confidence": 0-100,
  "severity": 1-10
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048 }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Gemini API error');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({
      verdict: result.verdict ?? "Unable to determine a verdict.",
      reasoning: result.reasoning ?? "",
      winner: result.winner ?? "neither",
      confidence: result.confidence ?? 50,
      severity: result.severity ?? 5,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process request. Please try again.' });
  }
}
