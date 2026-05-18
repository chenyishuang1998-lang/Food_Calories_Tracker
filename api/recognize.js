import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const PROMPT = 'Identify all foods in this image. Return only raw JSON, no markdown: {"items":[{"name":"food name","cal":integer_kcal,"emoji":"single emoji"}]}. Estimate kcal for visible portion. List every distinct food item.';

async function recognize(apiKey, base64, mediaType) {
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
        { type: 'text', text: PROMPT }
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
      ({ apiKey, base64, mediaType } = body);
    }

    if (!apiKey || !base64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const text = await recognize(apiKey, base64, mediaType);
    const parsed = JSON.parse(text);
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
