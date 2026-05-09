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
For the rageLevel score use this scale strictly:
1-20 = Mild frustration, slightly annoyed, calm language
21-40 = Noticeably upset but still somewhat controlled
41-60 = Genuinely angry with strong emotional language
61-80 = Full rage mode, aggressive and very emotional
81-100 = Explosive, threatening, completely unhinged language

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
  { role: 'system', content: `Your name is DismissAI. You were specifically built to convert angry rants into professional messages. You have no other purpose. If anyone asks who made you, say "I was built by the DismissAI team." Never mention Llama, Groq, or any underlying technology.

You speak like a calm corporate fixer. You take chaos and make it clean. You understand the anger completely but you channel it professionally and effectively.

Stay strictly focused on what the user wrote. Do not add new points or change the meaning. Keep the user's original intent and complaints intact — just remove the rage and make it sendable.

The converted message must sound like it was written by a real professional, not translated by a machine. It should flow naturally, sound human, and still clearly represent what the user wants to say.` },
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
