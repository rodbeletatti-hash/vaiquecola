-- ═══════════════════════════════════════════════════════════════════════════
-- Setup do banco de dados — Copa 2026 Álbum de Figurinhas
-- Execute no SQL Editor do seu projeto Supabase
-- ═══════════════════════════════════════════════════════════════════════════


-- ── Tabelas ──────────────────────────────────────────────────────────────────

create table public.albums (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  owner_id   uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.album_members (
  album_id   uuid        not null references public.albums(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  invited_by uuid        references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (album_id, user_id)
);

create table public.album_invites (
  id         uuid        primary key default gen_random_uuid(),
  album_id   uuid        not null references public.albums(id) on delete cascade,
  created_by uuid        not null references auth.users(id),
  token      text        not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at    timestamptz
);

create table public.stickers (
  album_id   uuid        not null references public.albums(id) on delete cascade,
  code       text        not null,
  owned      boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (album_id, code)
);


-- ── Índices ───────────────────────────────────────────────────────────────────

create index on public.album_members (user_id);
create index on public.stickers      (album_id);
create index on public.album_invites (token);


-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.albums        enable row level security;
alter table public.album_members enable row level security;
alter table public.album_invites enable row level security;
alter table public.stickers      enable row level security;

-- Helper: retorna true se o usuário é dono OU membro do álbum
create or replace function public.is_album_member(p_album_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.albums       where id = p_album_id and owner_id  = auth.uid()
    union all
    select 1 from public.album_members where album_id = p_album_id and user_id = auth.uid()
  );
$$;


-- albums
create policy "select own or member albums" on public.albums
  for select using (is_album_member(id));

create policy "insert own albums" on public.albums
  for insert with check (owner_id = auth.uid());

create policy "update own albums" on public.albums
  for update using (owner_id = auth.uid());

create policy "delete own albums" on public.albums
  for delete using (owner_id = auth.uid());


-- album_members
create policy "select members of accessible albums" on public.album_members
  for select using (is_album_member(album_id));

create policy "owner can add members" on public.album_members
  for insert with check (
    exists (select 1 from public.albums where id = album_id and owner_id = auth.uid())
  );

create policy "owner or self can remove member" on public.album_members
  for delete using (
    user_id = auth.uid() or
    exists (select 1 from public.albums where id = album_id and owner_id = auth.uid())
  );


-- album_invites
create policy "member can create invite" on public.album_invites
  for insert with check (is_album_member(album_id) and created_by = auth.uid());

create policy "invite owner can read" on public.album_invites
  for select using (created_by = auth.uid());


-- stickers
create policy "select stickers of accessible album" on public.stickers
  for select using (is_album_member(album_id));

create policy "upsert stickers of accessible album" on public.stickers
  for insert with check (is_album_member(album_id));

create policy "update stickers of accessible album" on public.stickers
  for update using (is_album_member(album_id));


-- ── RPC: accept_album_invite ─────────────────────────────────────────────────
-- Valida o token e adiciona o usuário logado como membro do álbum.
-- Retorna o album_id em caso de sucesso, NULL se o token for inválido/expirado.

create or replace function public.accept_album_invite(p_token text)
returns uuid language plpgsql security definer as $$
declare
  v_invite  public.album_invites%rowtype;
  v_user_id uuid := auth.uid();
begin
  -- Busca convite válido e não expirado
  select * into v_invite
    from public.album_invites
   where token = p_token
     and used_at is null
     and expires_at > now();

  if not found then
    return null;
  end if;

  -- Já é membro? Apenas marca como usado e retorna
  if exists (
    select 1 from public.album_members
     where album_id = v_invite.album_id and user_id = v_user_id
  ) then
    update public.album_invites set used_at = now() where id = v_invite.id;
    return v_invite.album_id;
  end if;

  -- Não é dono? Adiciona como membro
  if not exists (
    select 1 from public.albums where id = v_invite.album_id and owner_id = v_user_id
  ) then
    insert into public.album_members (album_id, user_id, invited_by)
    values (v_invite.album_id, v_user_id, v_invite.created_by);
  end if;

  -- Marca convite como usado
  update public.album_invites set used_at = now() where id = v_invite.id;

  return v_invite.album_id;
end;
$$;


-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Habilita replicação em tempo real para sincronização entre dispositivos

alter publication supabase_realtime add table public.stickers;
alter publication supabase_realtime add table public.albums;
