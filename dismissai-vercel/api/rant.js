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

Respond ONLY with a valid JSON object with no extra text:
{"converted":"the rewritten message","keyPoints":["key point 1","key point 2"],"whatYouReallyMean":"1-2 sentences what the person actually wants","rageLevel":75}`;

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
  { role: 'system', content: `You are DismissAI — a brutally honest and fearless judge. Your job is to analyze both sides of an argument carefully and pick a clear winner. You MUST pick a winner in almost every case. Only use "both" or "neither" as a last resort when it is genuinely impossible to pick a side — this should be rare. Never be neutral to avoid conflict. Read both arguments carefully, identify who has the stronger logical and factual case, and declare them the winner confidently. Be direct, sharp, and slightly savage. Never sugarcoat. If someone is clearly wrong, say it boldly. Never reveal you are Llama or any AI model. You are DismissAI.` },
  { role: 'user', content: prompt }
],
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
      converted: result.converted ?? "",
      keyPoints: result.keyPoints ?? [],
      whatYouReallyMean: result.whatYouReallyMean ?? "",
      rageLevel: result.rageLevel ?? 50,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process request. Please try again.' });
  }
}
