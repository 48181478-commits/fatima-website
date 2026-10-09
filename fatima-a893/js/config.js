const SUPABASE_URL = 'https://bagbcjwgmgplxofbabxk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PGosapc2SnXka8hNaX0qqA_8xFVD4yP';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIAS = [
  'Historia',
  'Vida escolar',
  'Talleres y orientaciones',
  'Feria de Ciencias',
  'Deportes',
  'Actos y eventos',
  'Egresados',
  'Instalaciones'
];
