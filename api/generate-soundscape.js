export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bpm, mood, customPrompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  let zone = 'Fokus';
  if (bpm < 60) zone = 'Ruhe-Zone';
  else if (bpm < 100) zone = 'Fokus-Zone';
  else if (bpm < 140) zone = 'Training-Zone';
  else zone = 'Maximal-Zone';

  const prompt = `Erstelle eine Playlist mit genau 5 echten, berühmten Songs passend zu:
- BPM: ${bpm}
- Zone: ${zone}
- Stimmung: ${mood}
- Zusatz: ${customPrompt || 'Keine'}

Antworte NUR mit diesem JSON (kein Markdown):
{
  "bpm": ${bpm},
  "zoneLabel": "${zone}",
  "playlistName": "kreativer Name",
  "playlistDescription": "kurze Beschreibung",
  "songs": [
    {
      "id": "1",
      "title": "echter Titel",
      "artist": "echter Künstler",
      "album": "echtes Album",
      "duration": "3:30",
      "approxBpm": "120 BPM",
      "reason": "Begründung auf Deutsch"
    }
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
