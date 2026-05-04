// ─── App Principal ────────────────────────────────────────────────────────────

// ── Estado global ─────────────────────────────────────────────────────────────
const state = {
  user:           null,
  album:          null,   // { id, name, is_owner }
  owned:          new Set(),
  filter:         'all',
  search:         '',
  undoStack:      [],
  realtimeCh:     null,
  cameraActive:   false,
  pendingInvite:   null,
  editMode:        false,
  compareRepeats:  null,   // Set<string> vindo de um link ?compare=TOKEN
  compareAlbums:   null,   // lista de álbuns do usuário para seleção
  compareMatches:  null,   // { matches: string[], albumName: string }
  tradeMode:      false,
  tradePending:   new Set(),
  completedFilter: 'all', // 'all' | 'hide' | 'only'
};

// ── Utilitários de UI ─────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let _toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${type} visible`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
}

function showModal(html, onOpen) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-bg').classList.remove('hidden');
  if (onOpen) onOpen();
}

function closeModal() {
  document.getElementById('modal-bg').classList.add('hidden');
}

function showLoading(show) {
  document.getElementById('loading').classList.toggle('hidden', !show);
}

// ── Tela de Auth ──────────────────────────────────────────────────────────────

// ── Auth: passo 1 — enviar código ────────────────────────────────────────────

let _otpEmail = '';

document.getElementById('form-auth').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('input-email').value.trim();
  const msgEl = document.getElementById('auth-msg');
  const btnEl = document.getElementById('btn-send-link');
  btnEl.disabled = true;
  msgEl.textContent = '';
  try {
    await auth.signInWithMagicLink(email);
    _otpEmail = email;
    document.getElementById('otp-email-label').textContent = email;
    document.getElementById('form-auth').classList.add('hidden');
    document.getElementById('form-otp').classList.remove('hidden');
    document.getElementById('input-otp').focus();
    msgEl.textContent = '';
  } catch {
    msgEl.textContent = 'Erro ao enviar código. Tente novamente.';
    msgEl.className   = 'auth-msg error';
  } finally {
    btnEl.disabled = false;
  }
});

// ── Auth: passo 2 — verificar código ─────────────────────────────────────────

document.getElementById('form-otp').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = document.getElementById('input-otp').value.trim();
  const msgEl = document.getElementById('auth-msg');
  const btnEl = document.getElementById('btn-verify-otp');
  btnEl.disabled = true;
  msgEl.textContent = '';
  try {
    await auth.verifyOtp(_otpEmail, token);
    // onAuthStateChange vai redirecionar automaticamente
  } catch {
    msgEl.textContent = 'Código inválido ou expirado. Tente novamente.';
    msgEl.className   = 'auth-msg error';
    btnEl.disabled = false;
  }
});

document.getElementById('btn-back-email').addEventListener('click', () => {
  document.getElementById('form-otp').classList.add('hidden');
  document.getElementById('form-auth').classList.remove('hidden');
  document.getElementById('auth-msg').textContent = '';
});

// ── Tela Home (Lista de Álbuns) ───────────────────────────────────────────────

async function renderAlbums() {
  showLoading(true);
  try {
    const albums = await db.getAlbums(state.user.id);
    const list   = document.getElementById('albums-list');

    if (albums.length === 0) {
      list.innerHTML = '<p class="empty-state">Nenhum álbum ainda.<br>Crie o primeiro!</p>';
      return;
    }

    list.innerHTML = albums.map(a => `
      <div class="album-card" data-id="${a.id}">
        <div class="album-info">
          <span class="album-name">${escapeHtml(a.name)}</span>
          ${a.is_shared ? '<span class="badge-shared">Compartilhado</span>' : ''}
        </div>
        <button class="btn-primary" onclick="openAlbum('${a.id}','${escapeHtml(a.name)}',${a.is_owner})">
          Abrir →
        </button>
      </div>
    `).join('');
  } finally {
    showLoading(false);
  }
}

document.getElementById('btn-new-album').addEventListener('click', () => {
  showModal(`
    <h3>Novo Álbum</h3>
    <input id="modal-album-name" type="text" placeholder="Nome do álbum" maxlength="50" autofocus>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="createAlbum()">Criar</button>
    </div>
  `, () => {
    const inp = document.getElementById('modal-album-name');
    inp.focus();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') createAlbum(); });
  });
});

async function createAlbum() {
  const name = document.getElementById('modal-album-name')?.value?.trim();
  if (!name) return;
  closeModal();
  try {
    await db.createAlbum(name, state.user.id);
    await renderAlbums();
    toast('Álbum criado!', 'success');
  } catch {
    toast('Erro ao criar álbum', 'error');
  }
}

document.getElementById('btn-logout').addEventListener('click', async () => {
  await auth.signOut();
  state.user  = null;
  state.album = null;
  showScreen('screen-auth');
});

// ── Tela de Álbum ─────────────────────────────────────────────────────────────

function setEditMode(on) {
  state.editMode = on;
  const screen = document.getElementById('screen-album');
  screen.classList.toggle('edit-mode', on);
  document.getElementById('btn-edit-mode').textContent = on ? 'Concluir' : 'Editar';
  document.getElementById('quick-input').placeholder = on ? 'Ex: BRA5, ARG12…' : 'Buscar figurinha…';
}

function updateTradeCounter() {
  const n = state.tradePending.size;
  document.getElementById('trade-counter').textContent =
    `${n} encontrada${n !== 1 ? 's' : ''} para troca`;
}

function enterTradeMode() {
  closeModal();
  setEditMode(false);
  state.tradeMode    = true;
  state.tradePending = new Set();
  document.getElementById('screen-album').classList.add('trade-mode');
  document.getElementById('trade-bar').classList.remove('hidden');
  document.getElementById('btn-trade-mode').classList.add('hidden');
  document.getElementById('btn-edit-mode').classList.add('hidden');
  document.getElementById('btn-album-menu').classList.add('hidden');
  updateTradeCounter();
  renderStickers();
}

function exitTradeMode(save) {
  if (!state.tradeMode && !save) return;
  state.tradeMode    = false;
  state.tradePending = new Set();
  document.getElementById('screen-album').classList.remove('trade-mode');
  document.getElementById('trade-bar').classList.add('hidden');
  document.getElementById('btn-trade-mode').classList.remove('hidden');
  document.getElementById('btn-edit-mode').classList.remove('hidden');
  document.getElementById('btn-album-menu').classList.remove('hidden');
}

async function saveTradeMode() {
  if (state.tradePending.size === 0) { exitTradeMode(false); renderStickers(); return; }
  showLoading(true);
  try {
    await Promise.all([...state.tradePending].map(c => db.setSticker(state.album.id, c, true)));
    state.tradePending.forEach(c => state.owned.add(c));
    toast(`${state.tradePending.size} figurinha${state.tradePending.size !== 1 ? 's' : ''} salva${state.tradePending.size !== 1 ? 's' : ''}!`, 'success');
  } catch {
    toast('Erro ao salvar', 'error');
  } finally {
    showLoading(false);
  }
  exitTradeMode(true);
  updateProgress();
  renderStickers();
}

async function openAlbum(id, name, isOwner) {
  state.album  = { id, name, is_owner: isOwner };
  state.search = '';
  quickInput.value = '';
  quickInput.className = '';
  setEditMode(false);
  exitTradeMode(false);
  state.completedFilter = 'all';
  applyCompletedFilterBtn();
  document.getElementById('screen-album').classList.remove('searching');
  document.getElementById('album-title').textContent = name;
  document.getElementById('stickers-container').innerHTML = '';

  showScreen('screen-album');
  showLoading(true);

  try {
    const rows  = await db.getStickers(id);
    state.owned = new Set(rows.filter(r => r.owned).map(r => r.code));
    state.filter = 'all';
    document.querySelectorAll('.filter').forEach(b =>
      b.classList.toggle('active', b.dataset.filter === 'all')
    );
  } finally {
    showLoading(false);
  }

  renderStickers();
  updateProgress();

  // Realtime
  if (state.realtimeCh) db.unsubscribe(state.realtimeCh);
  state.realtimeCh = db.subscribeToAlbum(id, handleRealtimeChange);

  // Foca input rápido
  setTimeout(() => document.getElementById('quick-input').focus(), 150);
}

function handleRealtimeChange(payload) {
  const { code, owned } = payload.new;
  if (owned) state.owned.add(code);
  else        state.owned.delete(code);
  // Atualiza só o tile afetado (sem re-renderizar tudo)
  const tile = document.querySelector(`.sticker[data-code="${code}"]`);
  if (tile) tile.classList.toggle('owned', owned);
  updateProgress();
  updateSectionProgress(code);

}

// ── Grade de Figurinhas ───────────────────────────────────────────────────────

function renderStickers() {
  const container  = document.getElementById('stickers-container');
  const filter     = state.filter;
  const isEmblemas = filter === 'emblemas';
  const search     = (state.search || '').toUpperCase();
  let html = '';

  const groups = [...new Set(CATALOG.map(s => s.group))];
  for (const group of groups) {
    const sections = CATALOG.filter(s => s.group === group);
    let groupHtml  = '';

    for (const section of sections) {
      // Emblemas: apenas seções de países (com flag), mostra só a figurinha 1
      if (isEmblemas && !section.flag) continue;

      const allCodes = getSectionCodes(section);
      const codes    = isEmblemas ? [allCodes[0]] : allCodes;

      const afterSearch = search ? codes.filter(c => c.startsWith(search)) : codes;

      const visible = isEmblemas
        ? afterSearch
        : filter === 'all'   ? afterSearch
        : filter === 'owned' ? afterSearch.filter(c => state.owned.has(c) || state.tradePending.has(c))
        :                      afterSearch.filter(c => !state.owned.has(c) && !state.tradePending.has(c));

      if (visible.length === 0) continue;

      const ownedCnt = allCodes.filter(c => state.owned.has(c) || state.tradePending.has(c)).length;

      // Filtro de seções completas (não se aplica ao modo emblemas)
      if (!isEmblemas) {
        if (state.completedFilter === 'hide' && ownedCnt === allCodes.length) continue;
        if (state.completedFilter === 'only' && ownedCnt !== allCodes.length) continue;
      }

      const sectionPct = allCodes.length > 0 ? Math.round(ownedCnt / allCodes.length * 100) : 0;
      groupHtml += `
        <div class="section">
          <div class="section-header">
            <span class="section-name">${section.flag ? section.flag + ' ' : ''}${escapeHtml(section.name)}</span>
            <span class="section-progress ${ownedCnt === allCodes.length ? 'complete' : ''}">
              ${ownedCnt}/${allCodes.length} &nbsp; ${sectionPct}%
            </span>
          </div>
          <div class="section-bar">
            <div class="section-bar-fill" data-section-fill="${escapeHtml(section.id)}" style="width:${sectionPct}%"></div>
          </div>
          <div class="sticker-grid">
            ${visible.map(code => {
              const cls = state.owned.has(code) ? 'owned'
                        : state.tradePending.has(code) ? 'trade' : '';
              return `<button class="sticker ${cls}" data-code="${code}" onclick="toggleSticker('${code}')">${code}</button>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (groupHtml) {
      html += `
        <div class="group" data-group="${escapeHtml(group)}">
          <h3 class="group-title">${escapeHtml(group)}</h3>
          ${groupHtml}
        </div>
      `;
    }
  }

  if (!html) {
    html = '<p class="empty-state">Nenhuma figurinha nessa categoria.</p>';
  }

  container.innerHTML = html;
}

function updateProgress() {
  const total  = CATALOG_TOTAL;
  const owned  = state.owned.size;
  const pct    = total > 0 ? (owned / total * 100) : 0;

  document.getElementById('progress-fill').style.width  = `${pct}%`;
  const missing = total - owned;
  document.getElementById('progress-label').textContent = `${owned} / ${total} (${pct.toFixed(1)}%) — faltam ${missing}`;
}


function updateSectionProgress(code) {
  const section = getSectionForCode(code);
  if (!section) return;
  const codes    = getSectionCodes(section);
  const ownedCnt = codes.filter(c => state.owned.has(c)).length;
  // Localiza o elemento da seção: tenta pelo tile exato ou pelo prefixo da seção
  const anyTile  = document.querySelector(`.sticker[data-code="${code}"]`)?.closest('.section')
    ? document.querySelector(`.sticker[data-code="${code}"]`)
    : document.querySelector(`.sticker[data-code^="${section.id}"]`);
  if (!anyTile) return;
  const sectionEl  = anyTile.closest('.section');
  if (!sectionEl) return;
  const sectionPct = codes.length > 0 ? Math.round(ownedCnt / codes.length * 100) : 0;
  const progressEl = sectionEl.querySelector('.section-progress');
  if (progressEl) {
    progressEl.innerHTML = `${ownedCnt}/${codes.length} &nbsp; ${sectionPct}%`;
    progressEl.classList.toggle('complete', ownedCnt === codes.length);
  }
  const fillEl = sectionEl.querySelector('.section-bar-fill');
  if (fillEl) fillEl.style.width = `${sectionPct}%`;
}

// ── Filtros ───────────────────────────────────────────────────────────────────

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach(b =>
      b.classList.toggle('active', b === btn)
    );
    renderStickers();
  });
});

function applyCompletedFilterBtn() {
  const btn = document.getElementById('btn-hide-completed');
  const labels = { all: 'Completas', hide: 'Ocultar completas', only: 'Só completas' };
  btn.textContent = labels[state.completedFilter];
  btn.dataset.state = state.completedFilter;
}

document.getElementById('btn-hide-completed').addEventListener('click', () => {
  const next = { all: 'hide', hide: 'only', only: 'all' };
  state.completedFilter = next[state.completedFilter];
  applyCompletedFilterBtn();
  renderStickers();
});

// ── Marcar / Desmarcar Figurinha ─────────────────────────────────────────────

async function toggleSticker(code) {
  if (state.tradeMode) {
    if (state.owned.has(code)) return;
    const inTrade = state.tradePending.has(code);
    if (inTrade) state.tradePending.delete(code);
    else         state.tradePending.add(code);
    const tile = document.querySelector(`.sticker[data-code="${code}"]`);
    if (tile) {
      tile.classList.toggle('trade', !inTrade);
      tile.classList.add('flash');
      setTimeout(() => tile.classList.remove('flash'), 400);
    }
    updateTradeCounter();
    updateSectionProgress(code);
    updateProgress();
    return;
  }
  if (!state.editMode) return;
  const wasOwned = state.owned.has(code);
  const nowOwned = !wasOwned;

  // Atualização otimista
  if (nowOwned) state.owned.add(code);
  else           state.owned.delete(code);

  const tile = document.querySelector(`.sticker[data-code="${code}"]`);
  if (tile) {
    tile.classList.toggle('owned', nowOwned);
    tile.classList.add('flash');
    setTimeout(() => tile.classList.remove('flash'), 400);
  }
  updateProgress();
  updateSectionProgress(code);


  const ok = await db.setSticker(state.album.id, code, nowOwned);
  if (!ok) {
    // Rollback
    if (wasOwned) state.owned.add(code);
    else           state.owned.delete(code);
    if (tile) tile.classList.toggle('owned', wasOwned);
    updateProgress();
    toast('Erro ao salvar', 'error');
    return;
  }

  // Histórico de desfazer
  state.undoStack.push({ code, wasOwned });
  if (state.undoStack.length > 10) state.undoStack.shift();

  toast(nowOwned ? `✓ ${code} marcada` : `✕ ${code} desmarcada`, nowOwned ? 'success' : 'warn');
}

async function undo() {
  if (!state.editMode) return;
  if (state.undoStack.length === 0) { toast('Nada para desfazer', 'info'); return; }
  const { code, wasOwned } = state.undoStack.pop();
  await db.setSticker(state.album.id, code, wasOwned);
  if (wasOwned) state.owned.add(code);
  else           state.owned.delete(code);
  const tile = document.querySelector(`.sticker[data-code="${code}"]`);
  if (tile) tile.classList.toggle('owned', wasOwned);
  updateProgress();
  toast(`Desfeito: ${code}`, 'info');
}

// ── Input Rápido ─────────────────────────────────────────────────────────────

const quickInput = document.getElementById('quick-input');

// Filtro em tempo real conforme digita
quickInput.addEventListener('input', () => {
  const raw = quickInput.value.trim().toUpperCase();

  if (!raw) {
    quickInput.className = '';
    state.search = '';
    document.getElementById('screen-album').classList.remove('searching');
    renderStickers();
    return;
  }

  state.search = raw;
  renderStickers();

  // getBoundingClientRect sempre retorna posição visual correta no iOS,
  // ao contrário de offsetTop que retorna 0 em containers position:fixed+flex.
  // rAF garante que o iOS terminou de processar o innerHTML antes de scrollar.
  requestAnimationFrame(() => {
    const container = document.getElementById('stickers-container');
    const firstGrid = container.querySelector('.sticker-grid');
    if (firstGrid) {
      const offset = firstGrid.getBoundingClientRect().top
                   - container.getBoundingClientRect().top;
      container.scrollTop += offset;
    } else {
      container.scrollTop = 0;
    }
  });

  // Cor do input: verde = tenho, vermelho = não tenho, neutro = código parcial
  if (isValidStickerCode(raw)) {
    quickInput.className = state.owned.has(raw) ? 'input-has' : 'input-missing';
  } else {
    quickInput.className = '';
  }
});

// Modo compacto quando teclado abre: esconde barra de progresso
quickInput.addEventListener('focus', () => {
  document.getElementById('screen-album').classList.add('searching');
});
quickInput.addEventListener('blur', () => {
  if (!state.search) document.getElementById('screen-album').classList.remove('searching');
});

// Enter ainda marca/desmarca a figurinha
quickInput.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const raw = quickInput.value.trim().toUpperCase();
  if (!raw) return;
  if (!isValidStickerCode(raw)) {
    toast(`"${raw}" não é um código válido`, 'error');
    return;
  }
  await toggleSticker(raw);
  // Atualiza cor do input após marcar
  quickInput.className = state.owned.has(raw) ? 'input-has' : 'input-missing';
  quickInput.select();
});

// Atalho de teclado: '/' ou Espaço foca o input
document.addEventListener('keydown', (e) => {
  const albumScreen = document.getElementById('screen-album');
  if (!albumScreen.classList.contains('active')) return;
  if (document.activeElement === quickInput) return;

  if (e.key === '/' || (e.key === ' ' && document.activeElement.tagName !== 'BUTTON')) {
    e.preventDefault();
    quickInput.focus();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
  }
});

document.getElementById('btn-trade-mode').addEventListener('click', enterTradeMode);
document.getElementById('btn-edit-mode').addEventListener('click', () => setEditMode(!state.editMode));
document.getElementById('btn-trade-cancel').addEventListener('click', () => { exitTradeMode(false); renderStickers(); });
document.getElementById('btn-trade-save').addEventListener('click', saveTradeMode);
document.getElementById('btn-undo').addEventListener('click', undo);

// ── Menu do Álbum (⋯) ─────────────────────────────────────────────────────────

document.getElementById('btn-album-menu').addEventListener('click', () => {
  const { name, is_owner } = state.album;
  showModal(`
    <h3>${escapeHtml(name)}</h3>
    <div class="menu-list">
      <button class="menu-item" onclick="shareAlbum()">Compartilhar álbum</button>
      <button class="menu-item" onclick="generateCompareLink()">Gerar link de comparação</button>
      <button class="menu-item" onclick="openParseModal()">Comparar por lista ou foto</button>
      <button class="menu-item" onclick="exportStickers('missing')">Exportar faltantes</button>
      <button class="menu-item" onclick="exportStickers('all')">Exportar álbum completo</button>
      ${is_owner ? `
        <button class="menu-item" onclick="renameAlbum()">Renomear</button>
        <button class="menu-item danger" onclick="confirmDeleteAlbum()">Excluir álbum</button>
      ` : ''}
      <button class="menu-item" onclick="closeModal()">Fechar</button>
    </div>
  `);
});

async function shareAlbum() {
  closeModal();
  showLoading(true);
  try {
    const token = await db.createInvite(state.album.id, state.user.id);
    const url   = `${window.location.origin}${window.location.pathname}?invite=${token}`;
    const waMsg = encodeURIComponent(`Abra o link para ver meu álbum da Copa 2026: ${url}`);
    showModal(`
      <h3>Compartilhar Álbum</h3>
      <p class="share-hint">Envie o link para a pessoa que deseja convidar. O link expira em 7 dias.</p>
      <div class="share-url">${escapeHtml(url)}</div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="copyInviteLink('${escapeHtml(url)}')">Copiar link</button>
        <a class="btn-primary" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">
          WhatsApp
        </a>
      </div>
      <button class="btn-text" onclick="closeModal()">Fechar</button>
    `);
  } catch {
    toast('Erro ao gerar link', 'error');
  } finally {
    showLoading(false);
  }
}

function copyInviteLink(url) {
  navigator.clipboard.writeText(url).then(
    ()  => toast('Link copiado!', 'success'),
    ()  => toast('Não foi possível copiar', 'error')
  );
}

// ── Comparação de Figurinhas Repetidas ────────────────────────────────────────

async function generateCompareLink() {
  closeModal();
  showLoading(true);
  try {
    const token = await db.createInvite(state.album.id, state.user.id);
    const url   = `${window.location.origin}${window.location.pathname}?compare=${token}`;
    const waMsg = encodeURIComponent(`Acesse o link para ver quais das minhas figurinhas repetidas você precisa: ${url}`);
    showModal(`
      <h3>Link de Comparação</h3>
      <p class="share-hint">Envie para quem quiser saber quais figurinhas deste álbum completam o delas. O link expira em 7 dias.</p>
      <div class="share-url">${escapeHtml(url)}</div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="copyInviteLink('${escapeHtml(url)}')">Copiar link</button>
        <a class="btn-primary" href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
      <button class="btn-text" onclick="closeModal()">Fechar</button>
    `);
  } catch {
    toast('Erro ao gerar link', 'error');
  } finally {
    showLoading(false);
  }
}

async function _loadAndShowAlbumPicker() {
  const albums = await db.getAlbums(state.user.id);
  state.compareAlbums = albums;

  if (!albums.length) {
    showModal(`
      <h3>Comparar Figurinhas</h3>
      <p class="share-hint">Você precisa ter um álbum para comparar.<br>Crie um álbum primeiro!</p>
      <button class="btn-primary" onclick="closeModal()">OK</button>
    `);
    return;
  }

  const total = state.compareRepeats.size;
  const btns  = albums.map(a =>
    `<button class="menu-item" onclick="doCompare('${a.id}')">${escapeHtml(a.name)}</button>`
  ).join('');

  showModal(`
    <h3>Comparar Figurinhas</h3>
    <p class="share-hint">${total} figurinha${total !== 1 ? 's' : ''} disponível. Selecione seu álbum para ver quais te faltam:</p>
    <div class="menu-list">${btns}</div>
    <button class="btn-text" onclick="closeModal()">Cancelar</button>
  `);
}

async function handleCompare(token) {
  showLoading(true);
  try {
    const codes = await db.readAlbumForCompare(token);
    state.compareRepeats = new Set(codes);
    await _loadAndShowAlbumPicker();
  } catch {
    toast('Link de comparação inválido ou expirado', 'error');
  } finally {
    showLoading(false);
  }
}

async function doCompare(albumId) {
  const albumName = state.compareAlbums?.find(a => a.id === albumId)?.name ?? '';
  showLoading(true);
  try {
    const rows    = await db.getStickers(albumId);
    const owned   = new Set(rows.filter(r => r.owned).map(r => r.code));
    const matches = CATALOG.flatMap(s => getSectionCodes(s))
      .filter(c => state.compareRepeats.has(c) && !owned.has(c));

    if (!matches.length) {
      showModal(`
        <h3>Sem combinações 😔</h3>
        <p class="share-hint">Nenhuma figurinha repetida completa o álbum <strong>${escapeHtml(albumName)}</strong>.</p>
        <button class="btn-primary" onclick="closeModal()">Fechar</button>
      `);
      return;
    }

    // Agrupa por seção
    const grouped = {};
    for (const code of matches) {
      const sec = getSectionForCode(code);
      if (!sec) continue;
      if (!grouped[sec.id]) grouped[sec.id] = { sec, nums: [] };
      grouped[sec.id].nums.push(code === '00' ? '00' : code.slice(sec.id.length));
    }

    const listHtml = Object.values(grouped).map(({ sec, nums }) =>
      `<div class="cmp-row">
        <span class="cmp-team">${sec.flag ?? ''} ${sec.id}</span>
        <span class="cmp-nums">${nums.join(', ')}</span>
      </div>`
    ).join('');

    state.compareMatches = { matches, albumName };

    showModal(`
      <h3>${matches.length} figurinha${matches.length !== 1 ? 's' : ''} combinam! 🎉</h3>
      <p class="share-hint">Essas repetidas completam o álbum <strong>${escapeHtml(albumName)}</strong>:</p>
      <div class="cmp-list">${listHtml}</div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal()">Fechar</button>
        <button class="btn-primary" onclick="exportCompareList()">Exportar lista</button>
      </div>
    `);
  } catch {
    toast('Erro ao comparar álbuns', 'error');
  } finally {
    showLoading(false);
  }
}

function exportCompareList() {
  const { matches, albumName } = state.compareMatches ?? {};
  if (!matches?.length) return;

  const title = `Figurinhas para repassar — ${albumName}`;

  const grouped = {};
  for (const code of matches) {
    const sec = getSectionForCode(code);
    if (!sec) continue;
    if (!grouped[sec.id]) grouped[sec.id] = { sec, nums: [] };
    grouped[sec.id].nums.push(code === '00' ? '00' : code.slice(sec.id.length));
  }

  const rows = Object.values(grouped).map(({ sec, nums }) =>
    `<tr><td class="et">${sec.flag ?? ''} ${sec.id}</td><td class="en">${nums.join(', ')}</td></tr>`
  ).join('');

  const page = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;padding:16px;color:#111;max-width:600px;margin:0 auto}
    h1{font-size:16px;margin-bottom:4px;font-weight:700}
    .sub{font-size:10px;color:#666;margin-bottom:14px}
    .print-btn{display:block;margin:0 auto 14px;padding:5px 18px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600}
    @media print{.print-btn{display:none}@page{margin:12mm}}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:5px 8px;font-size:11px;text-align:left}
    th{background:#f3f4f6;font-weight:700}
    .et{width:90px;font-weight:700;white-space:nowrap}
    tr:nth-child(even){background:#f9fafb}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
  <h1>${title}</h1>
  <p class="sub">${matches.length} figurinha${matches.length !== 1 ? 's' : ''} • Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
  <table>
    <thead><tr><th>Time</th><th>Figurinhas</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(page); win.document.close(); }
  else      { toast('Permita pop-ups para exportar', 'error'); }
}

// ── Comparar por lista ou foto (GenAI) ────────────────────────────────────────

function openParseModal() {
  closeModal();
  showModal(`
    <h3>Comparar por Lista ou Foto</h3>
    <div class="parse-tabs">
      <button class="parse-tab active" data-tab="text" onclick="switchParseTab(this)">📋 Texto</button>
      <button class="parse-tab" data-tab="image" onclick="switchParseTab(this)">📷 Foto</button>
    </div>
    <div id="parse-panel-text" class="parse-panel">
      <p class="share-hint">Cole a lista de figurinhas repetidas em qualquer formato. A IA extrai os códigos automaticamente.</p>
      <textarea id="parse-text" rows="5" placeholder="Ex: BRA5, BRA12, ARG3&#10;ou: BRA: 5, 7, 12 | ARG: 3&#10;ou texto livre..."></textarea>
    </div>
    <div id="parse-panel-image" class="parse-panel hidden">
      <p class="share-hint">Envie uma foto com os códigos das figurinhas repetidas. A IA faz a leitura.</p>
      <label class="parse-upload-btn">
        <input type="file" id="parse-file" accept="image/*" onchange="previewParseImage(this)">
        Toque para selecionar foto
      </label>
      <img id="parse-img-preview" class="parse-img-preview hidden" alt="">
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" id="btn-parse-run" onclick="parseAndCompare()">Processar com IA</button>
    </div>
  `);
}

function switchParseTab(btn) {
  document.querySelectorAll('.parse-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.parse-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`parse-panel-${btn.dataset.tab}`).classList.remove('hidden');
}

function previewParseImage(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById('parse-img-preview');
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('hidden');
  input.closest('.parse-upload-btn').querySelector('span') ??
    Object.assign(input.nextSibling ?? {}, {});
  input.closest('label').childNodes.forEach(n => {
    if (n.nodeType === 3) n.textContent = file.name;
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function parseAndCompare() {
  const activeTab = document.querySelector('.parse-tab.active')?.dataset.tab ?? 'text';
  let payload;

  if (activeTab === 'text') {
    const text = document.getElementById('parse-text')?.value.trim() ?? '';
    if (!text) { toast('Cole uma lista primeiro', 'error'); return; }
    payload = { text };
  } else {
    const file = document.getElementById('parse-file')?.files[0];
    if (!file) { toast('Selecione uma foto primeiro', 'error'); return; }
    const base64 = await fileToBase64(file);
    payload = { image: base64, mediaType: file.type };
  }

  closeModal();
  showLoading(true);
  try {
    const raw   = await db.parseStickerCodes(payload);
    const valid = raw.filter(c => isValidStickerCode(c));

    if (!valid.length) {
      showModal(`
        <h3>Nenhum código encontrado</h3>
        <p class="share-hint">A IA não encontrou códigos de figurinhas válidos. Tente uma imagem mais nítida ou revise o texto.</p>
        <button class="btn-primary" onclick="openParseModal()">Tentar novamente</button>
      `);
      return;
    }

    state.compareRepeats = new Set(valid);
    await _loadAndShowAlbumPicker();
  } catch (err) {
    toast(`Erro: ${err.message ?? 'tente novamente'}`, 'error');
  } finally {
    showLoading(false);
  }
}

function exportStickers(mode) {
  closeModal();

  const isMissingOnly = mode === 'missing';
  const albumName     = state.album.name;
  const title         = isMissingOnly
    ? `Faltando — ${albumName}`
    : `Álbum completo — ${albumName}`;

  // Mapeamento: código → índice de coluna
  // '00' → coluna 0; 'BRA5' → coluna 5; 'FWC12' → coluna 12
  const codeToCol = c => c === '00' ? 0 : parseInt(c.match(/(\d+)$/)[1], 10);

  // Colunas: 0 (para o '00' do FWC) + 1 até o maior número de figurinas (20)
  const maxNum    = Math.max(...CATALOG.map(s => s.count)); // 20
  const totalCols = maxNum + 1; // colunas 0–20

  let rows = '';
  for (const section of CATALOG) {
    const codes = getSectionCodes(section);
    if (isMissingOnly && codes.every(c => state.owned.has(c))) continue;

    const colMap = Object.fromEntries(codes.map(c => [codeToCol(c), c]));
    const ownedCount = codes.filter(c => state.owned.has(c)).length;
    const flag = section.flag ?? '';

    const progress = isMissingOnly ? '' : ` (${ownedCount}/${codes.length})`;
    rows += `<tr>`;
    rows += `<td class="team-cell">${flag}&nbsp;${section.id}<span class="progress">${progress}</span></td>`;

    for (let col = 0; col <= maxNum; col++) {
      const code  = colMap[col];
      if (!code) { rows += `<td class="cell cell-na"></td>`; continue; }

      const owned = state.owned.has(code);
      const label = col === 0 ? '00' : String(col);

      if (isMissingOnly) {
        rows += owned
          ? `<td class="cell cell-skip"></td>`
          : `<td class="cell cell-need">${label}</td>`;
      } else {
        rows += owned
          ? `<td class="cell cell-done">X</td>`
          : `<td class="cell cell-need">${label}</td>`;
      }
    }
    rows += `</tr>`;
  }

  const teamW    = 16;
  const cellW    = ((100 - teamW) / totalCols).toFixed(2);
  const colgroup = `<col style="width:${teamW}%">`
    + Array.from({length: totalCols}, () => `<col style="width:${cellW}%">`).join('');

  const headerCols = Array.from({length: totalCols}, (_, i) =>
    `<th>${i === 0 ? '00' : i}</th>`).join('');

  const page = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;padding:10px;color:#111;background:#fff}
    h1{font-size:14px;text-align:center;margin-bottom:3px;font-weight:700}
    .subtitle{text-align:center;font-size:9px;color:#666;margin-bottom:10px}
    .print-btn{display:block;margin:0 auto 12px;padding:5px 18px;background:#16a34a;color:#fff;border:none;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600}
    @media print{
      .print-btn{display:none}
      @page{size:A4 landscape;margin:8mm}
    }
    table{width:100%;border-collapse:collapse;table-layout:fixed}
    th{border:1px solid #999;background:#e5e7eb;font-size:7px;font-weight:700;text-align:center;padding:1px 0;height:15px}
    th:first-child{text-align:left;padding-left:4px;font-size:8px}
    .team-cell{border:1px solid #999;padding:2px 4px;font-weight:700;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#f9fafb}
    .progress{font-weight:400;color:#666;font-size:7px;margin-left:3px}
    .cell{border:1px solid #ccc;text-align:center;height:17px;font-size:7.5px;font-weight:600;vertical-align:middle}
    .cell-need{background:#fff;color:#222}
    .cell-done{background:#dcfce7;color:#15803d;font-weight:900;font-size:9px}
    .cell-skip{background:#f3f4f6;border-color:#e5e7eb}
    .cell-na{background:#efefef;border-color:#e5e7eb}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>
  <h1>${title}</h1>
  <p class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
  <table>
    <colgroup>${colgroup}</colgroup>
    <thead><tr><th>Time</th>${headerCols}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(page); win.document.close(); }
  else      { toast('Permita pop-ups para exportar', 'error'); }
}

async function renameAlbum() {
  closeModal();
  showModal(`
    <h3>Renomear Álbum</h3>
    <input id="modal-rename" type="text" value="${escapeHtml(state.album.name)}" maxlength="50" autofocus>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="doRenameAlbum()">Salvar</button>
    </div>
  `, () => {
    const inp = document.getElementById('modal-rename');
    inp.focus(); inp.select();
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') doRenameAlbum(); });
  });
}

async function doRenameAlbum() {
  const name = document.getElementById('modal-rename')?.value?.trim();
  if (!name) return;
  closeModal();
  try {
    await db.renameAlbum(state.album.id, name);
    state.album.name = name;
    document.getElementById('album-title').textContent = name;
    await renderAlbums();
    toast('Álbum renomeado', 'success');
  } catch {
    toast('Erro ao renomear', 'error');
  }
}

function confirmDeleteAlbum() {
  closeModal();
  showModal(`
    <h3>Excluir Álbum</h3>
    <p>Tem certeza? Esta ação não pode ser desfeita.</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-danger" onclick="doDeleteAlbum()">Excluir</button>
    </div>
  `);
}

async function doDeleteAlbum() {
  closeModal();
  try {
    db.unsubscribe(state.realtimeCh);
    await db.deleteAlbum(state.album.id);
    state.album     = null;
    state.realtimeCh = null;
    await renderAlbums();
    showScreen('screen-home');
    toast('Álbum excluído', 'info');
  } catch {
    toast('Erro ao excluir', 'error');
  }
}

// ── Navegação de Volta ────────────────────────────────────────────────────────

document.getElementById('btn-back').addEventListener('click', () => {
  if (state.tradeMode) { exitTradeMode(false); renderStickers(); return; }
  db.unsubscribe(state.realtimeCh);
  state.realtimeCh = null;
  showScreen('screen-home');
});

// Fechar modal clicando no fundo
document.getElementById('modal-bg').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-bg')) closeModal();
});

// ── Câmera ────────────────────────────────────────────────────────────────────

const camVideo   = document.getElementById('cam-video');
const camResult  = document.getElementById('cam-result');
const camBadge   = document.getElementById('cam-result-badge');
const camActions = document.getElementById('cam-result-actions');
const camStatus  = document.getElementById('cam-status');

// Modo: 'verify' (só mostra verde/vermelho) | 'mark' (pede confirmação)
let camMode = 'verify';
let camResultTimer = null;

document.getElementById('btn-mode-verify').addEventListener('click', () => setCamMode('verify'));
document.getElementById('btn-mode-mark').addEventListener('click',   () => setCamMode('mark'));

function setCamMode(mode) {
  camMode = mode;
  document.getElementById('btn-mode-verify').classList.toggle('active', mode === 'verify');
  document.getElementById('btn-mode-mark').classList.toggle('active',   mode === 'mark');
}

document.getElementById('btn-camera').addEventListener('click', openCamera);
document.getElementById('btn-cam-back').addEventListener('click', closeCamera);

document.getElementById('btn-cam-capture').addEventListener('click', async () => {
  camStatus.textContent = 'Lendo...';
  const code = await camera.captureOnce(camVideo);
  if (code) {
    showCameraResult(code);
  } else {
    camStatus.textContent = 'Não encontrado. Tente novamente.';
  }
});

document.getElementById('btn-cam-confirm').addEventListener('click', async () => {
  const code = camBadge.dataset.code;
  if (code) await toggleSticker(code);
  hideCameraResult();
  camera.resumeScan();
  camStatus.textContent = 'Aponte para o código da figurinha';
});

document.getElementById('btn-cam-skip').addEventListener('click', () => {
  hideCameraResult();
  camera.resumeScan();
  camStatus.textContent = 'Aponte para o código da figurinha';
});

async function openCamera() {
  showScreen('screen-camera');
  state.cameraActive = true;
  camStatus.textContent = 'Iniciando câmera...';
  try {
    await camera.start(camVideo);
    camStatus.textContent = 'Aponte para o código da figurinha';
    camera.startScan(camVideo, (code) => {
      showCameraResult(code);
    });
  } catch (err) {
    camStatus.textContent = 'Câmera não disponível. Use o input manual.';
    console.error(err);
  }
}

function closeCamera() {
  clearTimeout(camResultTimer);
  camera.stop();
  state.cameraActive = false;
  hideCameraResult();
  showScreen('screen-album');
}

function showCameraResult(code) {
  const owned = state.owned.has(code);
  camBadge.dataset.code = code;
  camBadge.className    = `cam-result-badge ${owned ? 'cam-has' : 'cam-missing'}`;
  camBadge.innerHTML    = `
    <span class="cam-code">${code}</span>
    <span class="cam-status-text">${owned ? 'JÁ TENHO!' : 'FALTANDO!'}</span>
  `;
  camResult.classList.remove('hidden');
  camStatus.textContent = owned ? 'Você já tem esta figurinha' : 'Você não tem esta figurinha';

  if (camMode === 'verify') {
    // Modo verificar: esconde botões e retoma scan após 2s
    camActions.classList.add('hidden');
    clearTimeout(camResultTimer);
    camResultTimer = setTimeout(() => {
      hideCameraResult();
      camera.resumeScan();
      camStatus.textContent = 'Aponte para o código da figurinha';
    }, 2000);
  } else {
    // Modo marcar: mostra botões de confirmação
    camActions.classList.remove('hidden');
  }
}

function hideCameraResult() {
  camResult.classList.add('hidden');
  camBadge.dataset.code = '';
}

// ── Convite (URL ?invite=TOKEN) ───────────────────────────────────────────────

async function handleInvite(token) {
  try {
    const albumId = await db.acceptInvite(token);
    if (albumId) toast('Álbum adicionado!', 'success');
  } catch {
    toast('Link de convite inválido ou expirado', 'error');
  }
  // Limpa o token da URL sem recarregar a página
  const url = new URL(window.location.href);
  url.searchParams.delete('invite');
  history.replaceState({}, '', url.toString());
}

// ── Inicialização ─────────────────────────────────────────────────────────────

async function init() {
  const params       = new URLSearchParams(window.location.search);
  const inviteToken  = params.get('invite');
  const compareToken = params.get('compare');

  // Preserva o token de comparação no sessionStorage para sobreviver ao login
  if (compareToken) {
    sessionStorage.setItem('pendingCompare', compareToken);
    const u = new URL(window.location.href);
    u.searchParams.delete('compare');
    history.replaceState({}, '', u.toString());
  }

  const _runPendingCompare = async () => {
    const token = sessionStorage.getItem('pendingCompare');
    if (token) { sessionStorage.removeItem('pendingCompare'); await handleCompare(token); }
  };

  // Escuta mudanças futuras (logout, refresh de token, etc.)
  auth.onAuthStateChange(async (user) => {
    const wasLoggedIn = !!state.user;
    state.user = user;

    if (user && !wasLoggedIn) {
      // Novo login (ex: magic link processado de forma assíncrona)
      await renderAlbums();
      showScreen('screen-home');
      await _runPendingCompare();
    } else if (!user && wasLoggedIn) {
      // Logout
      showScreen('screen-auth');
    }
  });

  // Verifica sessão existente imediatamente (cobre o caso do magic link)
  const session = await auth.getSession();
  if (session) {
    // Garante que o cliente usa o token correto em todas as requisições
    await supabaseClient.auth.setSession({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
    });
    state.user = session.user;
    if (inviteToken) await handleInvite(inviteToken);
    await renderAlbums();
    showScreen('screen-home');
    await _runPendingCompare();
  }

  // Desregistra qualquer service worker antigo
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => null);
  }
}

document.addEventListener('DOMContentLoaded', init);
