// ─── Catálogo de Figurinhas — Copa do Mundo FIFA 2026 ─────────────────────────
// Baseado no álbum oficial Panini FIFA World Cup 2026™
// Cada seção: { id, name, count, group, hasOO? }
// Código de figurinha = id + número (ex: BRA1, BRA2 ... BRA20)
// FWC usa hasOO:true → inclui figurinha "00" + FWC1–FWC19 (20 no total)
// CC:  figurinhas da Coca-Cola CC1–CC14

const CATALOG = [
  // ── Especiais ──────────────────────────────────────────────────────────────
  { id: 'FWC', name: 'FIFA World Cup 2026', count: 19, group: 'Especiais', hasOO: true },

  // ── Extras (fora das 980 oficiais) ────────────────────────────────────────
  { id: 'CC',  name: 'Coca-Cola',           count: 14, group: 'Extras' },

  // ── CONMEBOL (6) ───────────────────────────────────────────────────────────
  { id: 'BRA', name: 'Brasil',               count: 20, group: 'CONMEBOL', flag: '🇧🇷' },
  { id: 'ARG', name: 'Argentina',            count: 20, group: 'CONMEBOL', flag: '🇦🇷' },
  { id: 'COL', name: 'Colômbia',             count: 20, group: 'CONMEBOL', flag: '🇨🇴' },
  { id: 'URU', name: 'Uruguai',              count: 20, group: 'CONMEBOL', flag: '🇺🇾' },
  { id: 'ECU', name: 'Equador',              count: 20, group: 'CONMEBOL', flag: '🇪🇨' },
  { id: 'PAR', name: 'Paraguai',             count: 20, group: 'CONMEBOL', flag: '🇵🇾' },

  // ── UEFA (16) ──────────────────────────────────────────────────────────────
  { id: 'FRA', name: 'França',               count: 20, group: 'UEFA', flag: '🇫🇷' },
  { id: 'ESP', name: 'Espanha',              count: 20, group: 'UEFA', flag: '🇪🇸' },
  { id: 'ENG', name: 'Inglaterra',           count: 20, group: 'UEFA', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 'GER', name: 'Alemanha',             count: 20, group: 'UEFA', flag: '🇩🇪' },
  { id: 'POR', name: 'Portugal',             count: 20, group: 'UEFA', flag: '🇵🇹' },
  { id: 'NED', name: 'Holanda',              count: 20, group: 'UEFA', flag: '🇳🇱' },
  { id: 'BEL', name: 'Bélgica',             count: 20, group: 'UEFA', flag: '🇧🇪' },
  { id: 'SUI', name: 'Suíça',               count: 20, group: 'UEFA', flag: '🇨🇭' },
  { id: 'AUT', name: 'Áustria',             count: 20, group: 'UEFA', flag: '🇦🇹' },
  { id: 'CRO', name: 'Croácia',             count: 20, group: 'UEFA', flag: '🇭🇷' },
  { id: 'TUR', name: 'Turquia',             count: 20, group: 'UEFA', flag: '🇹🇷' },
  { id: 'BIH', name: 'Bósnia',              count: 20, group: 'UEFA', flag: '🇧🇦' },
  { id: 'CZE', name: 'Rep. Tcheca',         count: 20, group: 'UEFA', flag: '🇨🇿' },
  { id: 'SCO', name: 'Escócia',             count: 20, group: 'UEFA', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { id: 'SWE', name: 'Suécia',              count: 20, group: 'UEFA', flag: '🇸🇪' },
  { id: 'NOR', name: 'Noruega',             count: 20, group: 'UEFA', flag: '🇳🇴' },

  // ── CONCACAF (6) ───────────────────────────────────────────────────────────
  { id: 'USA', name: 'Estados Unidos',       count: 20, group: 'CONCACAF', flag: '🇺🇸' },
  { id: 'MEX', name: 'México',              count: 20, group: 'CONCACAF', flag: '🇲🇽' },
  { id: 'CAN', name: 'Canadá',              count: 20, group: 'CONCACAF', flag: '🇨🇦' },
  { id: 'PAN', name: 'Panamá',              count: 20, group: 'CONCACAF', flag: '🇵🇦' },
  { id: 'CUW', name: 'Curaçao',             count: 20, group: 'CONCACAF', flag: '🇨🇼' },
  { id: 'HAI', name: 'Haiti',               count: 20, group: 'CONCACAF', flag: '🇭🇹' },

  // ── CAF (10) ───────────────────────────────────────────────────────────────
  { id: 'MAR', name: 'Marrocos',             count: 20, group: 'CAF', flag: '🇲🇦' },
  { id: 'SEN', name: 'Senegal',              count: 20, group: 'CAF', flag: '🇸🇳' },
  { id: 'EGY', name: 'Egito',               count: 20, group: 'CAF', flag: '🇪🇬' },
  { id: 'RSA', name: 'África do Sul',        count: 20, group: 'CAF', flag: '🇿🇦' },
  { id: 'TUN', name: 'Tunísia',             count: 20, group: 'CAF', flag: '🇹🇳' },
  { id: 'CIV', name: 'Costa do Marfim',      count: 20, group: 'CAF', flag: '🇨🇮' },
  { id: 'ALG', name: 'Argélia',             count: 20, group: 'CAF', flag: '🇩🇿' },
  { id: 'COD', name: 'Congo',               count: 20, group: 'CAF', flag: '🇨🇩' },
  { id: 'GHA', name: 'Gana',                count: 20, group: 'CAF', flag: '🇬🇭' },
  { id: 'CPV', name: 'Cabo Verde',           count: 20, group: 'CAF', flag: '🇨🇻' },

  // ── AFC (9) ────────────────────────────────────────────────────────────────
  { id: 'JPN', name: 'Japão',               count: 20, group: 'AFC', flag: '🇯🇵' },
  { id: 'KOR', name: 'Coreia do Sul',        count: 20, group: 'AFC', flag: '🇰🇷' },
  { id: 'AUS', name: 'Austrália',            count: 20, group: 'AFC', flag: '🇦🇺' },
  { id: 'IRN', name: 'Irã',                 count: 20, group: 'AFC', flag: '🇮🇷' },
  { id: 'KSA', name: 'Arábia Saudita',       count: 20, group: 'AFC', flag: '🇸🇦' },
  { id: 'QAT', name: 'Catar',               count: 20, group: 'AFC', flag: '🇶🇦' },
  { id: 'IRQ', name: 'Iraque',              count: 20, group: 'AFC', flag: '🇮🇶' },
  { id: 'UZB', name: 'Uzbequistão',          count: 20, group: 'AFC', flag: '🇺🇿' },
  { id: 'JOR', name: 'Jordânia',            count: 20, group: 'AFC', flag: '🇯🇴' },

  // ── OFC (1) ────────────────────────────────────────────────────────────────
  { id: 'NZL', name: 'Nova Zelândia',        count: 20, group: 'OFC', flag: '🇳🇿' },
];

// Mapa rápido: código-prefixo → seção  (ex: 'BRA' → { id, name, count })
const CATALOG_MAP = Object.fromEntries(CATALOG.map(s => [s.id, s]));

// Total de figurinhas do álbum (seções com hasOO somam +1 pelo "00")
const CATALOG_TOTAL = CATALOG.reduce((sum, s) => sum + s.count + (s.hasOO ? 1 : 0), 0);

// Retorna a seção de um código (ex: 'BRA5' → seção BRA, '00' → seção FWC)
function getSectionForCode(code) {
  if (code === '00') return CATALOG_MAP['FWC'];
  const match = code.match(/^([A-Z]{2,4})\d+$/);
  return match ? CATALOG_MAP[match[1]] : null;
}

// Valida se um código completo pertence ao catálogo (ex: 'BRA5', '00')
function isValidStickerCode(code) {
  if (code === '00') return true;
  const match = code.match(/^([A-Z]{2,4})(\d{1,2})$/);
  if (!match) return false;
  const section = CATALOG_MAP[match[1]];
  if (!section) return false;
  const num = parseInt(match[2], 10);
  return num >= 1 && num <= section.count;
}

// Retorna todos os códigos de uma seção (ex: ['00','FWC1',...,'FWC19'] ou ['BRA1',...,'BRA20'])
function getSectionCodes(section) {
  const codes = Array.from({ length: section.count }, (_, i) => `${section.id}${i + 1}`);
  if (section.hasOO) codes.unshift('00');
  return codes;
}
