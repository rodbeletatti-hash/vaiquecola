// Edge Function: parse-stickers
// Extrai códigos de figurinhas de texto ou imagem usando Claude.
//
// Deploy:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase functions deploy parse-stickers
//
// Ou via Dashboard → Edge Functions → Secrets → adicione ANTHROPIC_API_KEY

import Anthropic from 'npm:@anthropic-ai/sdk';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT_IMAGE =
  'Esta imagem mostra códigos de figurinhas do álbum Panini Copa do Mundo FIFA 2026. ' +
  'Extraia TODOS os códigos visíveis. ' +
  'Formato: 2–4 letras maiúsculas + 1–2 dígitos. Exemplos: BRA5, ARG12, FWC3, CC14, USA20. ' +
  'Responda APENAS com um JSON array em maiúsculas: ["BRA5","ARG12"]. Nenhum outro texto.';

const promptText = (text: string) =>
  'Extraia os códigos de figurinhas da Copa 2026 do texto abaixo. ' +
  'Formato: 2–4 letras + 1–2 dígitos (BRA5, ARG12, FWC3, CC14). ' +
  'Aceite variações como "BRA: 5, 12" (→ BRA5, BRA12) ou "bra 5 arg3". ' +
  'Responda APENAS com JSON array em maiúsculas: ["BRA5","ARG12"]. Nenhum outro texto.\n\n' +
  `Texto:\n${text}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { text, image, mediaType } = await req.json() as {
      text?: string;
      image?: string;       // base64 sem prefixo data:…
      mediaType?: string;   // ex: 'image/jpeg'
    };

    const client = new Anthropic();

    const userContent = image
      ? [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: (mediaType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: image,
            },
          },
          { type: 'text' as const, text: PROMPT_IMAGE },
        ]
      : promptText(text ?? '');

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userContent }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]';

    let codes: string[] = [];
    try {
      codes = JSON.parse(raw);
    } catch {
      // Fallback: extrai com regex se o modelo não retornou JSON puro
      codes = [...raw.toUpperCase().matchAll(/\b([A-Z]{2,4}\d{1,2})\b/g)].map(m => m[1]);
    }

    return new Response(JSON.stringify({ codes: codes.map((c: string) => c.toUpperCase()) }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
