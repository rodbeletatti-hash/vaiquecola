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

  // Envia código OTP de 6 dígitos para o e-mail (sem link de redirecionamento)
  async function signInWithMagicLink(email) {
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }

  // Verifica o código OTP digitado pelo usuário
  async function verifyOtp(email, token) {
    const { error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: 'email',
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

  return { getSession, getUser, signInWithMagicLink, verifyOtp, signOut, onAuthStateChange };
})();
