export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rant, tone, recipient } = req.body;
  if (!rant) return res.status(400).json({ error: 'Rant is required' });

  const toneDescriptions = {
    professional: "calm, professional, and constructive",
    assertive: "clear, direct, and assertive without being aggressive",
    diplomatic: "tactful, empathetic, and solution-focused",
    "passive-aggressive": "politely passive-aggressive — technically civil but the message is unmistakably clear",
  };

  const toneDesc = toneDescriptions[tone] || "professional";

  const prompt = `You are a communication translator. Take raw emotional rants and convert them into more effective messages. Extract the core complaint and rewrite it in the requested tone.

Convert this rant into a ${toneDesc} message${recipient ? ` for ${recipient}` : ""}:
Rant: ${rant}

Respond ONLY with a valid JSON object:
{
  "converted": "the rewritten message in the requested tone",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "whatYouReallyMean": "1-2 sentences summarising what the person actually wants",
  "rageLevel": 0-100
}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2048 }
      })
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const result = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    res.json({
      converted: result.converted ?? "",
      keyPoints: result.keyPoints ?? [],
      whatYouReallyMean: result.whatYouReallyMean ?? "",
      rageLevel: result.rageLevel ?? 50,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
}
