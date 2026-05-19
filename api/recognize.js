import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const BASE_PROMPT = 'Identify all foods in this image. Group into dishes. Return ONLY raw JSON, no markdown, no explanation: {"items":[{"name":"dish name","cal":total_kcal_integer,"emoji":"emoji","components":[{"name":"component","cal":kcal_integer,"emoji":"emoji"}]}]}. Each top-level item is one dish. Components are its ingredients/parts. If a dish has no sub-parts, use empty array for components. Never return flat ungrouped items.';

async function recognize(apiKey, base64, mediaType, description) {
  const prompt = description
    ? `${BASE_PROMPT} Additional context from user: "${description}". Use this to improve accuracy.`
    : BASE_PROMPT;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${mediaType || 'image/jpeg'};base64,${base64}` } },
        { type: 'text', text: prompt }
      ]}]
    })
  });
  const data = await res.json();
  if (data.error) {
    const msg = data.error.message || '';
    if (msg.includes('429') || msg.includes('rate') || msg.includes('Too Many') || res.status === 429) {
      throw new Error('rate_limited');
    }
    throw new Error(msg);
  }
  return (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let apiKey, base64, mediaType;
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseMultipart(req);
      apiKey = Array.isArray(fields.apiKey) ? fields.apiKey[0] : fields.apiKey;
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      const fileBuffer = readFileSync(file.filepath);
      base64 = fileBuffer.toString('base64');
      mediaType = file.mimetype || 'image/jpeg';
    } else {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
        req.on('error', reject);
      });
      ({ apiKey, base64, mediaType, description } = body);
    }

    if (!apiKey || !base64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const text = await recognize(apiKey, base64, mediaType, description || '');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch(parseErr) {
      console.error('AI returned non-JSON:', text?.slice(0, 200));
      return res.status(500).json({ error: 'AI returned an unexpected response — please try again' });
    }
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    const msg = e.message || '';
    if (msg === 'rate_limited' || msg.includes('429') || msg.includes('Too Many') || msg.includes('rate')) {
      return res.status(429).json({ error: 'Too many requests — please try again in a moment' });
    }
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
