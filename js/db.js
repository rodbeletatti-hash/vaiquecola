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

  async function createInvite(albumId) {
    const { data, error } = await supabaseClient
      .from('album_invites')
      .insert({ album_id: albumId })
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

  return {
    getAlbums, createAlbum, renameAlbum, deleteAlbum,
    createInvite, acceptInvite,
    getStickers, setSticker,
    subscribeToAlbum, unsubscribe,
  };
})();
