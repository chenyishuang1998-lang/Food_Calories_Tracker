import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const PROMPT = 'Identify all foods in this image. Return only raw JSON, no markdown: {"items":[{"name":"food name","cal":integer_kcal,"emoji":"single emoji"}]}. Estimate kcal for visible portion. List every distinct food item.';

async function recognize(provider, apiKey, base64, mediaType) {
  if (provider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
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
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json|```/g, '').trim();
  } else {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return (data.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
  }
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
    let provider, apiKey, base64, mediaType;
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseMultipart(req);
      provider = Array.isArray(fields.provider) ? fields.provider[0] : fields.provider;
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
      ({ provider, apiKey, base64, mediaType } = body);
    }

    if (!provider || !apiKey || !base64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const text = await recognize(provider, apiKey, base64, mediaType);
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    let msg = e.message || 'Internal server error';
    // Try to extract quota reset time from Gemini error
    if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      const resetMatch = msg.match(/retry after (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^'"\s]*)/i);
      if (resetMatch) {
        const resetTime = new Date(resetMatch[1]);
        msg = `Quota exceeded — resets at ${resetTime.toLocaleTimeString()}`;
      } else {
        msg = 'Quota exceeded — resets daily at midnight Pacific Time';
      }
    }
    return res.status(500).json({ error: msg });
  }
}
