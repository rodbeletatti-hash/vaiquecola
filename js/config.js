// ─── Configuração do Supabase ──────────────────────────────────────────────────
// Preencha com as credenciais do seu projeto Supabase
// Painel: https://supabase.com/dashboard → Settings → API
const SUPABASE_URL     = 'https://hrjtejvagsjfhswqeumr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OLRrJW0gJFG2pDpPOKaEDg_nOLJSnLD';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
