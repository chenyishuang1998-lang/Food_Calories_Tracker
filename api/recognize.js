export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, apiKey, base64, mediaType } = req.body;
  if (!provider || !apiKey || !base64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const PROMPT = 'Identify all foods in this image. Return only raw JSON, no markdown: {"items":[{"name":"food name","cal":integer_kcal,"emoji":"single emoji"}]}. Estimate kcal for visible portion. List every distinct food item.';

  try {
    let text = '';

    if (provider === 'gemini') {
      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [
              { inline_data: { mime_type: mediaType || 'image/jpeg', data: base64 } },
              { text: PROMPT }
            ]}]
          })
        }
      );
      const data = await apiRes.json();
      if (data.error) return res.status(400).json({ error: data.error.message });
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    } else if (provider === 'anthropic') {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: base64 } },
            { type: 'text', text: PROMPT }
          ]}]
        })
      });
      const data = await apiRes.json();
      if (data.error) return res.status(400).json({ error: data.error.message });
      text = data.content?.[0]?.text || '';

    } else {
      return res.status(400).json({ error: 'Unknown provider' });
    }

    // Parse JSON from response
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
