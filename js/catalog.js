// ─── Catálogo de Figurinhas — Copa do Mundo FIFA 2026 ─────────────────────────
// Baseado no álbum oficial Panini FIFA World Cup 2026™
// Cada seção: { id, name, count, group }
// Código de figurinha = id + número (ex: BRA1, BRA2 ... BRA16)
//
// ⚠️  Atualize os totais por seção quando o álbum oficial for lançado.

const CATALOG = [
  // ── Especiais ──────────────────────────────────────────────────────────────
  { id: 'FWC', name: 'FIFA World Cup 2026',  count: 10, group: 'Especiais' },
  { id: 'EST', name: 'Estádios',             count: 20, group: 'Especiais' },
  { id: 'MAS', name: 'Mascote & Troféu',     count:  5, group: 'Especiais' },

  // ── CONMEBOL (6) ───────────────────────────────────────────────────────────
  { id: 'BRA', name: 'Brasil',               count: 20, group: 'CONMEBOL', flag: '🇧🇷' },
  { id: 'ARG', name: 'Argentina',            count: 20, group: 'CONMEBOL', flag: '🇦🇷' },
  { id: 'COL', name: 'Colômbia',             count: 20, group: 'CONMEBOL', flag: '🇨🇴' },
  { id: 'URU', name: 'Uruguai',              count: 20, group: 'CONMEBOL', flag: '🇺🇾' },
  { id: 'ECU', name: 'Equador',              count: 20, group: 'CONMEBOL', flag: '🇪🇨' },
  { id: 'VEN', name: 'Venezuela',            count: 20, group: 'CONMEBOL', flag: '🇻🇪' },

  // ── UEFA (16) ──────────────────────────────────────────────────────────────
  { id: 'FRA', name: 'França',               count: 20, group: 'UEFA', flag: '🇫🇷' },
  { id: 'ESP', name: 'Espanha',              count: 20, group: 'UEFA', flag: '🇪🇸' },
  { id: 'ENG', name: 'Inglaterra',           count: 20, group: 'UEFA', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'GER', name: 'Alemanha',             count: 20, group: 'UEFA', flag: '🇩🇪' },
  { id: 'POR', name: 'Portugal',             count: 20, group: 'UEFA', flag: '🇵🇹' },
  { id: 'NED', name: 'Países Baixos',        count: 20, group: 'UEFA', flag: '🇳🇱' },
  { id: 'BEL', name: 'Bélgica',             count: 20, group: 'UEFA', flag: '🇧🇪' },
  { id: 'ITA', name: 'Itália',              count: 20, group: 'UEFA', flag: '🇮🇹' },
  { id: 'SUI', name: 'Suíça',               count: 20, group: 'UEFA', flag: '🇨🇭' },
  { id: 'AUT', name: 'Áustria',             count: 20, group: 'UEFA', flag: '🇦🇹' },
  { id: 'CRO', name: 'Croácia',             count: 20, group: 'UEFA', flag: '🇭🇷' },
  { id: 'SRB', name: 'Sérvia',              count: 20, group: 'UEFA', flag: '🇷🇸' },
  { id: 'DEN', name: 'Dinamarca',            count: 20, group: 'UEFA', flag: '🇩🇰' },
  { id: 'POL', name: 'Polônia',             count: 20, group: 'UEFA', flag: '🇵🇱' },
  { id: 'TUR', name: 'Turquia',             count: 20, group: 'UEFA', flag: '🇹🇷' },
  { id: 'HUN', name: 'Hungria',             count: 20, group: 'UEFA', flag: '🇭🇺' },

  // ── CONCACAF (6) ───────────────────────────────────────────────────────────
  { id: 'USA', name: 'Estados Unidos',       count: 20, group: 'CONCACAF', flag: '🇺🇸' },
  { id: 'MEX', name: 'México',              count: 20, group: 'CONCACAF', flag: '🇲🇽' },
  { id: 'CAN', name: 'Canadá',              count: 20, group: 'CONCACAF', flag: '🇨🇦' },
  { id: 'PAN', name: 'Panamá',              count: 20, group: 'CONCACAF', flag: '🇵🇦' },
  { id: 'HON', name: 'Honduras',             count: 20, group: 'CONCACAF', flag: '🇭🇳' },
  { id: 'JAM', name: 'Jamaica',              count: 20, group: 'CONCACAF', flag: '🇯🇲' },

  // ── CAF (9) ────────────────────────────────────────────────────────────────
  { id: 'MAR', name: 'Marrocos',             count: 20, group: 'CAF', flag: '🇲🇦' },
  { id: 'SEN', name: 'Senegal',              count: 20, group: 'CAF', flag: '🇸🇳' },
  { id: 'EGY', name: 'Egito',               count: 20, group: 'CAF', flag: '🇪🇬' },
  { id: 'NGA', name: 'Nigéria',             count: 20, group: 'CAF', flag: '🇳🇬' },
  { id: 'CMR', name: 'Camarões',             count: 20, group: 'CAF', flag: '🇨🇲' },
  { id: 'RSA', name: 'África do Sul',        count: 20, group: 'CAF', flag: '🇿🇦' },
  { id: 'MLI', name: 'Mali',                count: 20, group: 'CAF', flag: '🇲🇱' },
  { id: 'TUN', name: 'Tunísia',             count: 20, group: 'CAF', flag: '🇹🇳' },
  { id: 'CIV', name: 'Costa do Marfim',      count: 20, group: 'CAF', flag: '🇨🇮' },

  // ── AFC (8) ────────────────────────────────────────────────────────────────
  { id: 'JPN', name: 'Japão',               count: 20, group: 'AFC', flag: '🇯🇵' },
  { id: 'KOR', name: 'Coreia do Sul',        count: 20, group: 'AFC', flag: '🇰🇷' },
  { id: 'AUS', name: 'Austrália',            count: 20, group: 'AFC', flag: '🇦🇺' },
  { id: 'IRN', name: 'Irã',                 count: 20, group: 'AFC', flag: '🇮🇷' },
  { id: 'KSA', name: 'Arábia Saudita',       count: 20, group: 'AFC', flag: '🇸🇦' },
  { id: 'QAT', name: 'Catar',               count: 20, group: 'AFC', flag: '🇶🇦' },
  { id: 'IRQ', name: 'Iraque',              count: 20, group: 'AFC', flag: '🇮🇶' },
  { id: 'UZB', name: 'Uzbequistão',          count: 20, group: 'AFC', flag: '🇺🇿' },

  // ── OFC (1) ────────────────────────────────────────────────────────────────
  { id: 'NZL', name: 'Nova Zelândia',        count: 20, group: 'OFC', flag: '🇳🇿' },

  // ── Playoffs Intercontinentais (2) ─────────────────────────────────────────
  { id: 'IC1', name: 'Playoff Intercont. 1', count: 16, group: 'Playoffs' },
  { id: 'IC2', name: 'Playoff Intercont. 2', count: 16, group: 'Playoffs' },
];

// Mapa rápido: código-prefixo → seção  (ex: 'BRA' → { id, name, count })
const CATALOG_MAP = Object.fromEntries(CATALOG.map(s => [s.id, s]));

// Total de figurinhas do álbum
const CATALOG_TOTAL = CATALOG.reduce((sum, s) => sum + s.count, 0);

// Valida se um código completo pertence ao catálogo (ex: 'BRA5')
function isValidStickerCode(code) {
  const match = code.match(/^([A-Z]{2,4})(\d{1,2})$/);
  if (!match) return false;
  const section = CATALOG_MAP[match[1]];
  if (!section) return false;
  const num = parseInt(match[2], 10);
  return num >= 1 && num <= section.count;
}

// Retorna todos os códigos de uma seção (ex: ['BRA1','BRA2',...,'BRA16'])
function getSectionCodes(section) {
  return Array.from({ length: section.count }, (_, i) => `${section.id}${i + 1}`);
}
