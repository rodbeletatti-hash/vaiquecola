// ─── Configuração ──────────────────────────────────────────────────────────────
// Em produção este arquivo é gerado pelo CI (deploy.yml) com os valores reais.
const SUPABASE_URL      = 'https://hrjtejvagsjfhswqeumr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_OLRrJW0gJFG2pDpPOKaEDg_nOLJSnLD';
const GEMINI_API_KEY    = '';   // injetado pelo CI via secret GEMINI_API_KEY

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
