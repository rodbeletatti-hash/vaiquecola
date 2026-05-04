-- ─── Tabela: figurinhas repetidas (global por usuário, sem álbum) ──────────────
--
-- Execute no SQL Editor do Supabase antes de usar a funcionalidade de Repetidas.

CREATE TABLE IF NOT EXISTS repeated_stickers (
  user_id    UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code       TEXT  NOT NULL,
  count      INT   NOT NULL DEFAULT 1 CHECK (count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, code)
);

ALTER TABLE repeated_stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas próprias repetidas"
ON repeated_stickers FOR ALL
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
