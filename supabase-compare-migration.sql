-- ── Migração: RPC para comparação de figurinhas repetidas ───────────────────
-- Execute no SQL Editor do seu projeto Supabase (uma única vez).
--
-- Permite ler as figurinhas de um álbum via token de convite, sem criar
-- membership — necessário para o fluxo de comparação de repetidas.

create or replace function public.read_album_for_compare(p_token text)
returns table(code text)
language plpgsql security definer as $$
declare
  v_album_id uuid;
begin
  select album_id into v_album_id
  from public.album_invites
  where token = p_token
    and expires_at > now();

  if not found then
    raise exception 'invalid_or_expired';
  end if;

  return query
    select s.code
    from public.stickers s
    where s.album_id = v_album_id
      and s.owned = true;
end;
$$;
