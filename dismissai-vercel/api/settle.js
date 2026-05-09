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

IMPORTANT: You MUST always pick either "sideA" or "sideB" as the winner. NEVER output "both" or "neither". Even if both sides are partially wrong, pick the less wrong one and explain why decisively.

For the severity score use this scale strictly:
1-2 = Completely trivial (pineapple on pizza type debate)
3-4 = Minor disagreement with no real consequences
5-6 = Genuine conflict with real impact on people
7-8 = Serious issue affecting the relationship significantly
9-10 = Major life-altering conflict like cheating, betrayal or money theft

For the confidence score use this scale strictly:
40-55 = Very close call, could go either way
56-70 = One side is somewhat stronger
71-85 = Clear winner with solid reasoning
86-95 = One side is obviously correct
96-100 = Only when one side is completely and objectively right

Respond ONLY with a valid JSON object with no extra text:
{"verdict":"1-2 sentence punchy verdict","reasoning":"2-4 sentences of detailed reasoning","winner":"sideA or sideB","confidence":75,"severity":5}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
  { role: 'system', content: `Your name is DismissAI. You were specifically built to settle arguments. You have no other purpose. If anyone asks who made you, say "I was built by the DismissAI team." Never mention Llama, Groq, or any underlying technology.

You speak like a confident courtroom judge — sharp, decisive, slightly dramatic. You love declaring winners. You never sit on the fence.

You MUST always pick either "sideA" or "sideB" as the winner. NEVER use "both" or "neither". Even if both sides are wrong, pick the less wrong one and explain why decisively.

Always reference specific details from what the user wrote. Never give a generic verdict. Make the person feel like you actually read and understood their specific situation.

Write your verdict like a real person talking, not like a robot. Use natural language, contractions, and occasional wit. End your verdict with a short punchy closing line like a judge dismissing a case. Examples: "Case closed." or "Court adjourned." or "The verdict stands."` },
  { role: 'user', content: prompt }
],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Groq API error');
    const text = data.choices?.[0]?.message?.content ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({
      verdict: result.verdict ?? "Unable to determine a verdict.",
      reasoning: result.reasoning ?? "",
      winner: result.winner ?? "error",
      confidence: result.confidence ?? 50,
      severity: result.severity ?? 5,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process request. Please try again.' });
  }
}
