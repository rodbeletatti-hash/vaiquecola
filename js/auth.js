// ─── Módulo de Autenticação (Supabase Magic Link) ─────────────────────────────

const auth = (() => {

  async function getSession() {
    const { data } = await supabaseClient.auth.getSession();
    return data?.session ?? null;   // retorna o objeto session completo (com access_token)
  }

  async function getUser() {
    const session = await getSession();
    return session?.user ?? null;
  }

  // Envia magic link para o e-mail informado.
  // redirectTo garante que o link funciona tanto em localhost quanto em produção.
  async function signInWithMagicLink(email) {
    const redirectTo = (window.location.origin + window.location.pathname).trim();
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabaseClient.auth.signOut();
  }

  // Retorna um unsubscribe { data: { subscription } }
  function onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }

  return { getSession, getUser, signInWithMagicLink, signOut, onAuthStateChange };
})();
