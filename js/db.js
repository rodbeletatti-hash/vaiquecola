// ─── Módulo de Banco de Dados (Supabase) ──────────────────────────────────────

const db = (() => {

  // ── Álbuns ────────────────────────────────────────────────────────────────

  async function getAlbums(userId) {
    // Query 1: álbuns que o usuário criou
    const { data: owned, error: e1 } = await supabaseClient
      .from('albums')
      .select('id, name, owner_id, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });
    if (e1) throw e1;

    // Query 2: álbuns em que o usuário é membro
    const { data: memberships, error: e2 } = await supabaseClient
      .from('album_members')
      .select('albums(id, name, owner_id, created_at)')
      .eq('user_id', userId);
    if (e2) throw e2;

    const memberAlbums = (memberships ?? []).map(m => m.albums).filter(Boolean);
    const memberIds    = new Set(memberAlbums.map(a => a.id));

    // Merge sem duplicatas
    const all = [...(owned ?? []), ...memberAlbums];
    const seen = new Set();
    return all
      .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(a => ({
        ...a,
        is_owner:  a.owner_id === userId,
        is_shared: memberIds.has(a.id),
      }));
  }

  async function createAlbum(name, userId) {
    const { data, error } = await supabaseClient
      .from('albums')
      .insert({ name, owner_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function renameAlbum(albumId, name) {
    const { error } = await supabaseClient
      .from('albums')
      .update({ name })
      .eq('id', albumId);
    if (error) throw error;
  }

  async function deleteAlbum(albumId) {
    const { error } = await supabaseClient
      .from('albums')
      .delete()
      .eq('id', albumId);
    if (error) throw error;
  }

  // ── Compartilhamento ──────────────────────────────────────────────────────

  async function createInvite(albumId, userId) {
    const { data, error } = await supabaseClient
      .from('album_invites')
      .insert({ album_id: albumId, created_by: userId })
      .select('token')
      .single();
    if (error) throw error;
    return data.token;
  }

  async function acceptInvite(token) {
    // Usa RPC para validar e aplicar o convite server-side
    const { data, error } = await supabaseClient.rpc('accept_album_invite', { p_token: token });
    if (error) throw error;
    return data; // album_id
  }

  // ── Figurinhas ────────────────────────────────────────────────────────────

  async function getStickers(albumId) {
    const { data, error } = await supabaseClient
      .from('stickers')
      .select('code, owned')
      .eq('album_id', albumId);
    if (error) throw error;
    return data ?? [];
  }

  // Marca ou desmarca uma figurinha (upsert)
  async function setSticker(albumId, code, owned) {
    const { error } = await supabaseClient
      .from('stickers')
      .upsert(
        { album_id: albumId, code, owned, updated_at: new Date().toISOString() },
        { onConflict: 'album_id,code' }
      );
    if (error) { console.error('setSticker error', error); return false; }
    return true;
  }

  // Realtime: escuta mudanças nas figurinhas de um álbum
  function subscribeToAlbum(albumId, onChange) {
    const channel = supabaseClient
      .channel(`album-${albumId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stickers', filter: `album_id=eq.${albumId}` },
        (payload) => onChange(payload)
      )
      .subscribe();
    return channel;
  }

  function unsubscribe(channel) {
    if (channel) supabaseClient.removeChannel(channel);
  }

  async function readAlbumForCompare(token) {
    const { data, error } = await supabaseClient.rpc('read_album_for_compare', { p_token: token });
    if (error) throw error;
    return (data ?? []).map(r => r.code);
  }

  // Chama a API da Anthropic diretamente para extrair códigos de texto ou imagem
  async function parseStickerCodes(payload) {
    if (!ANTHROPIC_API_KEY) throw new Error('Chave da API não configurada (ANTHROPIC_API_KEY)');

    const PROMPT_IMG =
      'Esta imagem mostra códigos de figurinhas do álbum Panini Copa do Mundo FIFA 2026. ' +
      'Extraia TODOS os códigos visíveis. Formato: 2–4 letras maiúsculas + 1–2 dígitos. ' +
      'Exemplos: BRA5, ARG12, FWC3, CC14. ' +
      'Responda APENAS com um JSON array em maiúsculas: ["BRA5","ARG12"]. Nenhum outro texto.';

    const PROMPT_TXT = (t) =>
      'Extraia os códigos de figurinhas da Copa 2026 do texto abaixo. ' +
      'Formato: 2–4 letras + 1–2 dígitos (BRA5, ARG12, FWC3, CC14). ' +
      'Aceite variações como "BRA: 5, 12" (→ BRA5, BRA12) ou "bra 5 arg3". ' +
      'Responda APENAS com JSON array em maiúsculas: ["BRA5","ARG12"]. Nenhum outro texto.\n\n' +
      `Texto:\n${t}`;

    const userContent = payload.image
      ? [
          { type: 'image', source: { type: 'base64', media_type: payload.mediaType ?? 'image/jpeg', data: payload.image } },
          { type: 'text', text: PROMPT_IMG },
        ]
      : PROMPT_TXT(payload.text ?? '');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message ?? `HTTP ${res.status}`);
    }

    const data = await res.json();
    const raw  = data.content?.[0]?.text?.trim() ?? '[]';

    let codes = [];
    try { codes = JSON.parse(raw); }
    catch { codes = [...raw.toUpperCase().matchAll(/\b([A-Z]{2,4}\d{1,2})\b/g)].map(m => m[1]); }

    return codes.map(c => String(c).toUpperCase());
  }

  return {
    getAlbums, createAlbum, renameAlbum, deleteAlbum,
    createInvite, acceptInvite,
    getStickers, setSticker,
    subscribeToAlbum, unsubscribe,
    readAlbumForCompare,
    parseStickerCodes,
  };
})();
