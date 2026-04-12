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
  { id: 'BRA', name: 'Brasil',               count: 20, group: 'CONMEBOL' },
  { id: 'ARG', name: 'Argentina',            count: 20, group: 'CONMEBOL' },
  { id: 'COL', name: 'Colômbia',             count: 20, group: 'CONMEBOL' },
  { id: 'URU', name: 'Uruguai',              count: 20, group: 'CONMEBOL' },
  { id: 'ECU', name: 'Equador',              count: 20, group: 'CONMEBOL' },
  { id: 'VEN', name: 'Venezuela',            count: 20, group: 'CONMEBOL' },

  // ── UEFA (16) ──────────────────────────────────────────────────────────────
  { id: 'FRA', name: 'França',               count: 20, group: 'UEFA' },
  { id: 'ESP', name: 'Espanha',              count: 20, group: 'UEFA' },
  { id: 'ENG', name: 'Inglaterra',           count: 20, group: 'UEFA' },
  { id: 'GER', name: 'Alemanha',             count: 20, group: 'UEFA' },
  { id: 'POR', name: 'Portugal',             count: 20, group: 'UEFA' },
  { id: 'NED', name: 'Países Baixos',        count: 20, group: 'UEFA' },
  { id: 'BEL', name: 'Bélgica',             count: 20, group: 'UEFA' },
  { id: 'ITA', name: 'Itália',              count: 20, group: 'UEFA' },
  { id: 'SUI', name: 'Suíça',               count: 20, group: 'UEFA' },
  { id: 'AUT', name: 'Áustria',             count: 20, group: 'UEFA' },
  { id: 'CRO', name: 'Croácia',             count: 20, group: 'UEFA' },
  { id: 'SRB', name: 'Sérvia',              count: 20, group: 'UEFA' },
  { id: 'DEN', name: 'Dinamarca',            count: 20, group: 'UEFA' },
  { id: 'POL', name: 'Polônia',             count: 20, group: 'UEFA' },
  { id: 'TUR', name: 'Turquia',             count: 20, group: 'UEFA' },
  { id: 'HUN', name: 'Hungria',             count: 20, group: 'UEFA' },

  // ── CONCACAF (6) ───────────────────────────────────────────────────────────
  { id: 'USA', name: 'Estados Unidos',       count: 20, group: 'CONCACAF' },
  { id: 'MEX', name: 'México',              count: 20, group: 'CONCACAF' },
  { id: 'CAN', name: 'Canadá',              count: 20, group: 'CONCACAF' },
  { id: 'PAN', name: 'Panamá',              count: 20, group: 'CONCACAF' },
  { id: 'HON', name: 'Honduras',             count: 20, group: 'CONCACAF' },
  { id: 'JAM', name: 'Jamaica',              count: 20, group: 'CONCACAF' },

  // ── CAF (9) ────────────────────────────────────────────────────────────────
  { id: 'MAR', name: 'Marrocos',             count: 20, group: 'CAF' },
  { id: 'SEN', name: 'Senegal',              count: 20, group: 'CAF' },
  { id: 'EGY', name: 'Egito',               count: 20, group: 'CAF' },
  { id: 'NGA', name: 'Nigéria',             count: 20, group: 'CAF' },
  { id: 'CMR', name: 'Camarões',             count: 20, group: 'CAF' },
  { id: 'RSA', name: 'África do Sul',        count: 20, group: 'CAF' },
  { id: 'MLI', name: 'Mali',                count: 20, group: 'CAF' },
  { id: 'TUN', name: 'Tunísia',             count: 20, group: 'CAF' },
  { id: 'CIV', name: 'Costa do Marfim',      count: 20, group: 'CAF' },

  // ── AFC (8) ────────────────────────────────────────────────────────────────
  { id: 'JPN', name: 'Japão',               count: 20, group: 'AFC' },
  { id: 'KOR', name: 'Coreia do Sul',        count: 20, group: 'AFC' },
  { id: 'AUS', name: 'Austrália',            count: 20, group: 'AFC' },
  { id: 'IRN', name: 'Irã',                 count: 20, group: 'AFC' },
  { id: 'KSA', name: 'Arábia Saudita',       count: 20, group: 'AFC' },
  { id: 'QAT', name: 'Catar',               count: 20, group: 'AFC' },
  { id: 'IRQ', name: 'Iraque',              count: 20, group: 'AFC' },
  { id: 'UZB', name: 'Uzbequistão',          count: 20, group: 'AFC' },

  // ── OFC (1) ────────────────────────────────────────────────────────────────
  { id: 'NZL', name: 'Nova Zelândia',        count: 20, group: 'OFC' },

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
