export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, context, category } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const categoryToneMap = {
    "Dating": "Focus on romantic relationship red flags: manipulation, attachment issues, boundary violations.",
    "Friendship": "Focus on friendship red flags: one-sidedness, betrayal, jealousy, social manipulation.",
    "Workplace": "Focus on professional red flags: power abuse, hostile environment, unfair treatment.",
    "Family": "Focus on family dynamic red flags: control, guilt-tripping, toxic patterns.",
  };

  const categoryGuidance = category && categoryToneMap[category] ? `\nCategory focus: ${categoryToneMap[category]}` : "";

  const prompt = `You are a no-nonsense red flag detector. Analyze text and situations to identify named, specific warning signs. Be direct, honest, and specific.${categoryGuidance}

Analyze this for red flags:
Text/Situation: ${text}${context ? `\nContext: ${context}` : ""}

Respond ONLY with a valid JSON object with no extra text:
{"redFlags":[{"flag":"Short flag name","explanation":"One sentence why this is a red flag","severity":"mild or moderate or severe"}],"summary":"2-3 sentence overall summary","overallRisk":"safe or low or medium or high or critical","advice":"1-2 sentences of actionable advice","score":5}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Groq API error');
    const rawText = data.choices?.[0]?.message?.content ?? '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({
      redFlags: result.redFlags ?? [],
      summary: result.summary ?? "",
      overallRisk: result.overallRisk ?? "safe",
      advice: result.advice ?? "",
      score: result.score ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process request. Please try again.' });
  }
}
