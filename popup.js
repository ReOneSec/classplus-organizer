'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const SUBJECTS = ['All','English','CDP','EVS','Reasoning','Math','Pedagogy','GK'];
const RANGE_SIZE = 10;

const STATUS_TAG = {
  'Not Started': 'tag-ns',
  'Watching':    'tag-wat',
  'Completed':   'tag-done',
  'Revise Later':'tag-rev',
};

// ── State ──────────────────────────────────────────────────────────────────
const S = {
  lectures:      [],
  userData:      {},
  folders:       [],
  entityId:      null,
  token:         null,
  tab:           'all',
  subject:       'All',
  query:         '',
  sort:          'newest',
  fltTeacher:    'all',
  fltDur:        'all',
  fltStatus:     'all',
  ctxId:         null,
  folderName:    null,
  fuse:          null,
  rangeDir:      'fwd',   // 'fwd' | 'rev'
  activeRange:   null,    // { start, end } lecture numbers (1-based)
  lastViewedId:  null,
  prefs: {
    theme:    'dark',
    fontSize: 'medium',
    contrast: 'normal',
  },
};

// ── Utils ──────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const durMins = d => { if (!d) return 0; const [h,m] = d.split(':').map(Number); return h*60+m; };

function merged(lec) {
  const u = S.userData[lec.id] || {};
  return {
    ...lec,
    bookmark: u.bookmark ?? false,
    status:   u.status   ?? 'Not Started',
    subject:  u.subject  ?? autoTag(lec.name),
    folder:   u.folder   ?? null,
  };
}

function autoTag(name='') {
  const n = name.toLowerCase();
  if (/\b(english|sentence|grammar|vocab|paragraph|reading|writing|language skill)\b/.test(n)) return 'English';
  if (/\b(cdp|child develop|learning disab|remedial|piaget|vygotsk)\b/.test(n)) return 'CDP';
  if (/\b(pedagog|evaluat|teach method|curricul)\b/.test(n)) return 'Pedagogy';
  if (/\b(evs|environment|ecosystem|ecology)\b/.test(n)) return 'EVS';
  if (/\b(reasoning|syllog|analogy|logic)\b/.test(n)) return 'Reasoning';
  if (/\b(math|number system|algebra|geometry|arithmetic)\b/.test(n)) return 'Math';
  if (/\b(gk|general knowledge|history|geography|polity)\b/.test(n)) return 'GK';
  return '';
}

// Assign stable lecture numbers (1-based, by original index = oldest-first)
function getLectureNumber(lec) {
  return S.lectures.findIndex(l => l.id === lec.id) + 1;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function setLoad(title, sub='') {
  $('load-title').textContent = title;
  $('load-sub').textContent = sub;
}

function setProgress(pct) {
  $('prog-fill').style.width = pct + '%';
  $('prog-label').textContent = pct + '%';
}

// ── Preferences ───────────────────────────────────────────────────────────
async function loadPrefs() {
  return new Promise(resolve => {
    chrome.storage.local.get(['prefs'], data => {
      if (data.prefs) Object.assign(S.prefs, data.prefs);
      resolve();
    });
  });
}

async function savePrefs() {
  return new Promise(resolve => {
    chrome.storage.local.set({ prefs: S.prefs }, resolve);
  });
}

function applyPrefs() {
  const html = document.documentElement;

  // Theme
  let theme = S.prefs.theme;
  if (theme === 'auto') {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  html.setAttribute('data-theme', theme);
  html.setAttribute('data-fontsize', S.prefs.fontSize);
  html.setAttribute('data-contrast', S.prefs.contrast);

  // Sync toggle buttons if settings screen is open
  ['dark','light','auto'].forEach(v => {
    const el = $(`theme-${v}`);
    if (el) el.classList.toggle('active', S.prefs.theme === v);
  });
  ['small','medium','large'].forEach(v => {
    const el = $(`fs-${v}`);
    if (el) el.classList.toggle('active', S.prefs.fontSize === v);
  });
  ['normal','high'].forEach(v => {
    const el = $(`contrast-${v}`);
    if (el) el.classList.toggle('active', S.prefs.contrast === v);
  });
}

async function setPref(key, val) {
  S.prefs[key] = val;
  await savePrefs();
  applyPrefs();
}

// Cycle font size on header button click
async function cycleFontSize() {
  const sizes = ['small', 'medium', 'large'];
  const idx = sizes.indexOf(S.prefs.fontSize);
  await setPref('fontSize', sizes[(idx + 1) % sizes.length]);
}

// Toggle theme on header button click
async function cycleTheme() {
  const themes = ['dark', 'light', 'auto'];
  const idx = themes.indexOf(S.prefs.theme);
  await setPref('theme', themes[(idx + 1) % themes.length]);
}

// ── Open Lecture ──────────────────────────────────────────────────────────
function openLecture(lec) {
  CPStorage.addRecentWatch(lec.id);
  S.lastViewedId = lec.id;
  chrome.storage.local.set({ lastViewedId: lec.id });

  chrome.runtime.sendMessage({
    type: 'OPEN_LECTURE',
    entityId:      S.entityId,
    liveSessionId: lec.liveSessionId,
    lectureId:     lec.id,
    lectureName:   lec.name,
  }, (res) => {
    // background.js now handles all cases including no_tab (opens tab + sets pendingLecture).
    // Nothing extra needed here — the click will happen automatically via content.js observer.
    if (res && !res.success && res.error && res.error !== 'no_tab') {
      console.warn('[ClassPlus Organizer] openLecture error:', res.error);
    }
  });
}

// ── Fetch ─────────────────────────────────────────────────────────────────
async function fetchAll(force=false) {
  showScreen('screen-loading');
  setLoad('Loading lectures…', 'Checking cache');

  if (!force) {
    const cached = await CPStorage.getLectures(S.entityId);
    if (cached.length > 0) {
      S.lectures = cached;
      await loadUserData();
      renderMain();
      return;
    }
  }

  setLoad('Fetching all lectures…', 'Paginating through API');
  $('load-bar-wrap').style.display = 'block';

  let fakeCt = 0;
  const ticker = setInterval(() => {
    fakeCt += Math.floor(Math.random() * 12) + 5;
    $('load-bar-label').textContent = `~${fakeCt} fetched…`;
    $('load-bar-fill').style.width = Math.min(fakeCt / 5, 90) + '%';
  }, 350);

  chrome.runtime.sendMessage(
    { type: 'FETCH_ALL_LECTURES', entityId: S.entityId, token: S.token },
    async (res) => {
      clearInterval(ticker);
      $('load-bar-fill').style.width = '100%';

      if (!res?.success) {
        setLoad('Fetch failed', res?.error || 'Check your ClassPlus session and try again');
        return;
      }

      S.lectures = res.lectures || [];
      await CPStorage.saveLectures(S.entityId, S.lectures);
      await CPStorage.setLastFetched(S.entityId);
      await loadUserData();
      renderMain();
    }
  );
}

async function loadUserData() {
  S.userData    = await CPStorage.getUserData(S.entityId);
  S.folders     = await CPStorage.getFolders(S.entityId);
  const stored  = await new Promise(r => chrome.storage.local.get(['lastViewedId'], r));
  S.lastViewedId = stored.lastViewedId || null;
}

function buildFuse() {
  if (typeof Fuse === 'undefined') return;
  S.fuse = new Fuse(S.lectures.map(l => merged(l)), {
    keys: ['name','tutorName','subject'],
    threshold: 0.35,
  });
}

// ── Filter / Sort ──────────────────────────────────────────────────────────
function filtered() {
  let list = S.lectures.map(l => merged(l));

  if (S.tab === 'bookmarks') list = list.filter(l => l.bookmark);
  if (S.tab === 'revision')  list = list.filter(l => l.status==='Revise Later' || l.status==='Watching');
  if (S.subject !== 'All')   list = list.filter(l => l.subject === S.subject);
  if (S.fltTeacher !== 'all') list = list.filter(l => l.tutorName === S.fltTeacher);
  if (S.fltStatus !== 'all') list = list.filter(l => l.status === S.fltStatus);
  if (S.fltDur === 'lt30')   list = list.filter(l => durMins(l.duration) < 30);
  if (S.fltDur === '30-60')  list = list.filter(l => { const m=durMins(l.duration); return m>=30&&m<=60; });
  if (S.fltDur === 'gt60')   list = list.filter(l => durMins(l.duration) > 60);

  // Range filter
  if (S.activeRange && S.tab === 'range') {
    const { start, end } = S.activeRange;
    list = list.filter(l => {
      const n = getLectureNumber(l);
      return n >= Math.min(start, end) && n <= Math.max(start, end);
    });
  }

  if (S.query.trim()) {
    const q = S.query.toLowerCase();
    if (S.fuse && S.query.length > 1) {
      list = S.fuse.search(q).map(r => r.item).filter(l => list.find(x => x.id===l.id));
    } else {
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.tutorName||'').toLowerCase().includes(q) ||
        (l.subject||'').toLowerCase().includes(q)
      );
    }
  }

  switch (S.sort) {
    case 'newest':   list.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); break;
    case 'oldest':   list.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)); break;
    case 'num-asc':  list.sort((a,b)=>getLectureNumber(a)-getLectureNumber(b)); break;
    case 'num-desc': list.sort((a,b)=>getLectureNumber(b)-getLectureNumber(a)); break;
    case 'dur-hi':   list.sort((a,b)=>durMins(b.duration)-durMins(a.duration)); break;
    case 'dur-lo':   list.sort((a,b)=>durMins(a.duration)-durMins(b.duration)); break;
    case 'alpha':    list.sort((a,b)=>a.name.localeCompare(b.name)); break;
  }
  return list;
}

// ── Range Navigation ───────────────────────────────────────────────────────
function buildRangeChips() {
  const total = S.lectures.length;
  if (total === 0) return;

  const chips = $('range-chips');
  chips.innerHTML = '';

  const groups = [];
  if (S.rangeDir === 'fwd') {
    for (let s = 1; s <= total; s += RANGE_SIZE) {
      const e = Math.min(s + RANGE_SIZE - 1, total);
      groups.push({ start: s, end: e });
    }
  } else {
    for (let s = total; s >= 1; s -= RANGE_SIZE) {
      const e = Math.max(s - RANGE_SIZE + 1, 1);
      groups.push({ start: s, end: e });
    }
  }

  groups.forEach(({ start, end }) => {
    const chip = document.createElement('button');
    chip.className = 'range-chip';
    chip.textContent = S.rangeDir === 'fwd' ? `${start}–${end}` : `${start}–${end}`;

    const isActive = S.activeRange &&
      Math.min(S.activeRange.start, S.activeRange.end) === Math.min(start, end) &&
      Math.max(S.activeRange.start, S.activeRange.end) === Math.max(start, end);
    if (isActive) chip.classList.add('active');

    chip.addEventListener('click', () => {
      S.activeRange = { start, end };
      buildRangeChips();
      renderLectures();
    });
    chips.appendChild(chip);
  });
}

// ── Jump to Lecture Number ─────────────────────────────────────────────────
let jumpDebounce;
function handleJumpInput(e) {
  const val = e.target.value.trim();
  const sugs = $('jump-suggestions');

  clearTimeout(jumpDebounce);
  if (!val) { sugs.classList.add('hidden'); return; }

  jumpDebounce = setTimeout(() => {
    const num = parseInt(val, 10);
    const total = S.lectures.length;

    if (isNaN(num) || num < 1) {
      sugs.innerHTML = `<div class="jump-error">Enter a number between 1 and ${total}</div>`;
      sugs.classList.remove('hidden');
      return;
    }

    if (num > total) {
      sugs.innerHTML = `<div class="jump-error">Only ${total} lectures available</div>`;
      sugs.classList.remove('hidden');
      return;
    }

    // Show exact match + nearby
    const results = [];
    for (let offset = 0; offset <= 2; offset++) {
      for (const delta of (offset === 0 ? [0] : [-offset, offset])) {
        const n = num + delta;
        if (n >= 1 && n <= total) {
          const lec = S.lectures[n - 1]; // 0-indexed
          if (lec && !results.find(r => r.n === n)) results.push({ n, lec: merged(lec) });
        }
      }
      if (results.length >= 4) break;
    }

    sugs.innerHTML = '';
    results.forEach(({ n, lec }) => {
      const item = document.createElement('div');
      item.className = 'jump-sug-item';
      item.innerHTML = `
        <span class="jump-sug-num">#${n}</span>
        <span class="jump-sug-name" title="${lec.name.replace(/"/g,'&quot;')}">${lec.name}</span>
      `;
      item.addEventListener('click', () => {
        sugs.classList.add('hidden');
        $('jump-input').value = '';
        jumpToLecture(n, lec);
      });
      sugs.appendChild(item);
    });
    sugs.classList.remove('hidden');
  }, 80);
}

function jumpToLecture(num, lec) {
  // Switch to all tab, reset filters, then scroll/highlight
  S.tab = 'all';
  S.activeRange = null;
  S.query = '';
  $('search-input').value = '';
  $('search-clear').classList.add('hidden');
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'all'));

  renderLectures();

  // Find and highlight the card
  requestAnimationFrame(() => {
    const card = document.querySelector(`.lec-card[data-id="${lec.id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlighted');
      setTimeout(() => card.classList.remove('highlighted'), 2000);
    }
  });
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderMain() {
  showScreen('screen-main');
  buildFuse();
  renderStats();
  renderPills();
  renderTeacherFilter();
  renderLectures();
  updateContinueBtn();
}

function renderStats() {
  const all   = S.lectures.map(l => merged(l));
  const total = all.length;
  const done  = all.filter(l=>l.status==='Completed').length;
  const pend  = total - done;
  const bk    = all.filter(l=>l.bookmark).length;
  const rev   = all.filter(l=>l.status==='Revise Later').length;
  $('s-total').textContent = total;
  $('s-done').textContent  = done;
  $('s-pend').textContent  = pend;
  $('s-bk').textContent    = bk;
  $('s-rev').textContent   = rev;

  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  setProgress(pct);

  // Progress banner
  $('pb-bar-fill').style.width = pct + '%';
  $('pb-completed-label').textContent = `Completed: ${done} / ${total}`;
  $('pb-remaining-label').textContent = `Remaining: ${pend}`;
}

function renderPills() {
  const row = $('pills-row');
  row.innerHTML = '';
  SUBJECTS.forEach(s => {
    const b = document.createElement('button');
    b.className = 'pill' + (S.subject===s ? ' active' : '');
    b.textContent = s;
    b.addEventListener('click', () => { S.subject=s; renderPills(); renderLectures(); });
    row.appendChild(b);
  });
}

function renderTeacherFilter() {
  const teachers = [...new Set(S.lectures.map(l=>l.tutorName).filter(Boolean))];
  const sel = $('flt-teacher');
  const cur = sel.value;
  sel.innerHTML = '<option value="all">All Teachers</option>';
  teachers.forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    if (cur===t) o.selected = true;
    sel.appendChild(o);
  });
}

function updateContinueBtn() {
  const btn = $('btn-continue');
  if (!S.lastViewedId) { btn.classList.add('hidden'); return; }
  const idx = S.lectures.findIndex(l => l.id == S.lastViewedId);
  if (idx < 0) { btn.classList.add('hidden'); return; }
  const num = idx + 1;
  btn.textContent = `▶ Continue #${num}`;
  btn.classList.remove('hidden');
}

function renderLectures() {
  const list   = $('lec-list');
  const empty  = $('empty-state');
  const fview  = $('folders-view');
  const rangeP = $('range-panel');

  // Folders tab
  if (S.tab === 'folders') {
    list.classList.add('hidden');
    fview.classList.remove('hidden');
    fview.style.display = 'flex';
    empty.classList.add('hidden');
    rangeP.classList.add('hidden');
    $('results-count').textContent = '';
    renderFoldersList();
    return;
  }

  list.classList.remove('hidden');
  fview.classList.add('hidden');
  fview.style.display = 'none';

  // Range tab
  if (S.tab === 'range') {
    rangeP.classList.remove('hidden');
    buildRangeChips();
  } else {
    rangeP.classList.add('hidden');
  }

  if (S.tab === 'recent') { renderRecent(); return; }

  const items = filtered();
  const q = S.query.trim();
  $('results-count').innerHTML = q
    ? `${items.length} result${items.length!==1?'s':''} for <span style="color:var(--text2)">"${q}"</span>`
    : `${items.length} lecture${items.length!==1?'s':''}`;

  list.innerHTML = '';
  if (items.length===0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  // Use DocumentFragment for performance with 500+ lectures
  const frag = document.createDocumentFragment();
  items.forEach(l => frag.appendChild(makeCard(l)));
  list.appendChild(frag);
}

async function renderRecent() {
  const list = $('lec-list');
  const empty = $('empty-state');
  $('results-count').textContent = '';
  list.innerHTML = '';

  const ids = await CPStorage.getRecentWatches();
  const byId = {};
  S.lectures.forEach(l => byId[l.id] = merged(l));
  const recents = ids.map(id=>byId[id]).filter(Boolean);

  if (recents.length===0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  $('results-count').textContent = `Last ${recents.length} opened`;

  const frag = document.createDocumentFragment();
  recents.forEach(l => frag.appendChild(makeCard(l)));
  list.appendChild(frag);
}

function renderFoldersList() {
  const container = $('folders-list');
  container.innerHTML = '';
  const allM = S.lectures.map(l=>merged(l));

  if (S.folders.length===0) {
    container.innerHTML = '<div style="padding:18px;text-align:center;font-size:11px;color:var(--text3)">No folders yet.</div>';
    return;
  }
  S.folders.forEach(name => {
    const count = allM.filter(l=>l.folder===name).length;
    const item = document.createElement('div');
    item.className = 'folder-item';
    item.innerHTML = `<span class="folder-ico">⊞</span><span class="folder-nm">${name}</span><span class="folder-ct">${count}</span><span class="folder-arr">›</span>`;
    item.addEventListener('click', () => openFolderView(name));
    container.appendChild(item);
  });
}

function openFolderView(name) {
  S.folderName = name;
  $('folder-detail-title').textContent = name;
  const allM = S.lectures.map(l=>merged(l));
  const items = allM.filter(l=>l.folder===name);
  const list = $('folder-lec-list');
  const empty = $('folder-empty');
  list.innerHTML = '';
  if (items.length===0) { empty.classList.remove('hidden'); }
  else {
    empty.classList.add('hidden');
    const frag = document.createDocumentFragment();
    items.forEach(l=>frag.appendChild(makeCard(l)));
    list.appendChild(frag);
  }
  showScreen('screen-folder');
}

// ── Card ───────────────────────────────────────────────────────────────────
function makeCard(lec) {
  const card = document.createElement('div');
  card.className = 'lec-card';
  card.dataset.id = lec.id;

  const thumbStyle = lec.thumbnailUrl
    ? `background-image:url(${lec.thumbnailUrl});background-color:var(--bg3)`
    : `background:var(--bg3)`;

  const mins    = durMins(lec.duration);
  const dateStr = (lec.createdAt||'').replace('On: ','').slice(0,7);
  const teacher = lec.tutorName || (lec.createdByText||'').replace('by ','') || '—';
  const statusCls = STATUS_TAG[lec.status] || 'tag-ns';
  const num = getLectureNumber(lec);

  card.innerHTML = `
    <span class="lec-num">#${num}</span>
    <div class="lec-thumb" style="${thumbStyle}">${lec.thumbnailUrl?'':'▶'}</div>
    <div class="lec-body">
      <div class="lec-name" title="${lec.name.replace(/"/g,'&quot;')}">${lec.name}</div>
      <div class="lec-meta">
        <span class="lec-teacher">${teacher}</span>
        <span class="meta-sep">·</span>
        <span class="lec-dur">${mins}m</span>
        <span class="meta-sep">·</span>
        <span class="lec-date">${dateStr}</span>
      </div>
      <div class="lec-tags">
        ${lec.subject ? `<span class="tag tag-subj">${lec.subject}</span>` : ''}
        <span class="tag ${statusCls}">${lec.status}</span>
        ${lec.folder ? `<span class="tag tag-fold">⊞ ${lec.folder}</span>` : ''}
      </div>
    </div>
    <button class="lec-bk${lec.bookmark?' on':''}" data-id="${lec.id}">${lec.bookmark?'★':'☆'}</button>
  `;

  card.querySelector('.lec-bk').addEventListener('click', async e => {
    e.stopPropagation();
    await toggleBookmark(lec.id);
  });

  card.addEventListener('click', () => openLecture(lec));

  let lpt;
  card.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e, lec.id); });
  card.addEventListener('mousedown',   e => { if(e.button!==2) lpt=setTimeout(()=>showCtx(e,lec.id),600); });
  card.addEventListener('mouseup',     () => clearTimeout(lpt));
  card.addEventListener('mouseleave',  () => clearTimeout(lpt));

  // Keyboard navigation
  card.setAttribute('tabindex', '0');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLecture(lec); }
  });

  return card;
}

// ── Bookmark ───────────────────────────────────────────────────────────────
async function toggleBookmark(id) {
  const cur = S.userData[id]?.bookmark ?? false;
  S.userData[id] = { ...(S.userData[id]||{}), bookmark: !cur };
  await CPStorage.saveUserData(S.entityId, S.userData);
  renderStats();
  document.querySelectorAll(`.lec-bk[data-id="${id}"]`).forEach(btn => {
    const on = S.userData[id].bookmark;
    btn.classList.toggle('on', on);
    btn.textContent = on ? '★' : '☆';
  });
}

// ── Context menu ───────────────────────────────────────────────────────────
function showCtx(e, id) {
  S.ctxId = id;
  const menu = $('ctx-menu');
  const ov   = $('overlay');
  menu.classList.remove('hidden');
  ov.classList.remove('hidden');
  const x = Math.min(e.clientX, window.innerWidth-180);
  const y = Math.min(e.clientY, window.innerHeight-200);
  menu.style.left = x+'px';
  menu.style.top  = y+'px';
}

function hideAll() {
  ['ctx-menu','picker-status','picker-tag','picker-folder','overlay','jump-suggestions'].forEach(id => {
    const el = $(id);
    if (el) el.classList.add('hidden');
  });
}

$('overlay').addEventListener('click', hideAll);

$('ctx-menu').addEventListener('click', async e => {
  const item = e.target.closest('.ctx-item');
  if (!item) return;
  const action = item.dataset.action;
  const id = S.ctxId;
  hideAll();

  if (action==='open') {
    const lec = S.lectures.find(l=>l.id==id);
    if (lec) openLecture(lec);
  }
  if (action==='bookmark') { await toggleBookmark(id); renderLectures(); }
  if (action==='status')   showPicker('picker-status', e);
  if (action==='tag')      showPicker('picker-tag', e);
  if (action==='folder')   { buildFolderPicker(); showPicker('picker-folder', e); }
});

function showPicker(pickerId, e) {
  const p = $(pickerId);
  const ov = $('overlay');
  p.classList.remove('hidden');
  ov.classList.remove('hidden');
  const x = Math.min(e.clientX, window.innerWidth-170);
  const y = Math.min(e.clientY, window.innerHeight-220);
  p.style.left = x+'px';
  p.style.top  = y+'px';
}

$('picker-status').addEventListener('click', async e => {
  const opt = e.target.closest('.picker-opt');
  if (!opt) return;
  S.userData[S.ctxId] = {...(S.userData[S.ctxId]||{}), status: opt.dataset.val};
  await CPStorage.saveUserData(S.entityId, S.userData);
  hideAll(); renderStats(); renderLectures();
});

$('picker-tag').addEventListener('click', async e => {
  const opt = e.target.closest('.picker-opt');
  if (!opt) return;
  S.userData[S.ctxId] = {...(S.userData[S.ctxId]||{}), subject: opt.dataset.val};
  await CPStorage.saveUserData(S.entityId, S.userData);
  hideAll(); buildFuse(); renderPills(); renderLectures();
});

function buildFolderPicker() {
  const container = $('picker-folder-opts');
  container.innerHTML = '';
  S.folders.forEach(f => {
    const d = document.createElement('div');
    d.className='picker-opt'; d.dataset.val=f; d.textContent='⊞ '+f;
    container.appendChild(d);
  });
}

$('picker-folder').addEventListener('click', async e => {
  const opt = e.target.closest('.picker-opt');
  if (!opt) return;
  const val = opt.dataset.val;

  if (val==='__new__') {
    hideAll();
    const name = prompt('Folder name:');
    if (name?.trim()) {
      S.folders.push(name.trim());
      await CPStorage.saveFolders(S.entityId, S.folders);
      S.userData[S.ctxId] = {...(S.userData[S.ctxId]||{}), folder: name.trim()};
      await CPStorage.saveUserData(S.entityId, S.userData);
      renderLectures();
    }
    return;
  }

  S.userData[S.ctxId] = {...(S.userData[S.ctxId]||{}), folder: val||null};
  await CPStorage.saveUserData(S.entityId, S.userData);
  hideAll(); renderLectures();
});

// ── Wire up controls ───────────────────────────────────────────────────────
$('btn-refresh').addEventListener('click', async () => {
  if (!S.entityId||!S.token) { showScreen('screen-notoken'); return; }
  await fetchAll(true);
});

$('btn-theme').addEventListener('click', cycleTheme);
$('btn-font-size').addEventListener('click', cycleFontSize);
$('btn-settings').addEventListener('click', () => { populateSettings(); showScreen('screen-settings'); });
$('btn-settings-back').addEventListener('click', renderMain);
$('btn-folder-back').addEventListener('click', renderMain);

$('btn-folder-del').addEventListener('click', async () => {
  if (!S.folderName) return;
  if (!confirm(`Delete folder "${S.folderName}"?`)) return;
  S.folders = S.folders.filter(f=>f!==S.folderName);
  await CPStorage.saveFolders(S.entityId, S.folders);
  for (const id in S.userData) {
    if (S.userData[id]?.folder===S.folderName) S.userData[id].folder=null;
  }
  await CPStorage.saveUserData(S.entityId, S.userData);
  renderMain();
});

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    S.tab = t.dataset.tab;
    S.activeRange = null;
    renderLectures();
  });
});

document.querySelectorAll('.stat[data-tab]').forEach(card => {
  card.addEventListener('click', () => {
    const tab = card.dataset.tab;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
    S.tab = tab;
    renderLectures();
  });
});

// Search
let searchDebounce;
$('search-input').addEventListener('input', e => {
  S.query = e.target.value;
  $('search-clear').classList.toggle('hidden', !S.query);
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(renderLectures, 80);
});
$('search-clear').addEventListener('click', () => {
  $('search-input').value=''; S.query='';
  $('search-clear').classList.add('hidden');
  renderLectures();
});

// Jump input
$('jump-input').addEventListener('input', handleJumpInput);
$('jump-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = parseInt($('jump-input').value.trim(), 10);
    if (!isNaN(val) && val >= 1 && val <= S.lectures.length) {
      const lec = merged(S.lectures[val - 1]);
      $('jump-suggestions').classList.add('hidden');
      $('jump-input').value = '';
      jumpToLecture(val, lec);
    }
  }
  if (e.key === 'Escape') {
    $('jump-suggestions').classList.add('hidden');
    $('jump-input').value = '';
  }
});
$('jump-input').addEventListener('blur', () => {
  setTimeout(() => $('jump-suggestions').classList.add('hidden'), 200);
});

// Filters
$('flt-teacher').addEventListener('change', e => { S.fltTeacher=e.target.value; renderLectures(); });
$('flt-dur').addEventListener('change', e => { S.fltDur=e.target.value; renderLectures(); });
$('flt-status').addEventListener('change', e => { S.fltStatus=e.target.value; renderLectures(); });
$('sort-sel').addEventListener('change', e => { S.sort=e.target.value; renderLectures(); });

// Range direction buttons
$('range-fwd').addEventListener('click', () => {
  S.rangeDir = 'fwd';
  S.activeRange = null;
  $('range-fwd').classList.add('active');
  $('range-rev').classList.remove('active');
  buildRangeChips();
  renderLectures();
});
$('range-rev').addEventListener('click', () => {
  S.rangeDir = 'rev';
  S.activeRange = null;
  $('range-rev').classList.add('active');
  $('range-fwd').classList.remove('active');
  buildRangeChips();
  renderLectures();
});

// Continue watching
$('btn-continue').addEventListener('click', () => {
  if (!S.lastViewedId) return;
  const idx = S.lectures.findIndex(l => l.id == S.lastViewedId);
  if (idx < 0) return;
  jumpToLecture(idx + 1, merged(S.lectures[idx]));
});

// Navigation buttons
$('btn-open-cp').addEventListener('click', () => chrome.tabs.create({url:'https://web.classplusapp.com/'}));
$('btn-manual-entry').addEventListener('click', () => showScreen('screen-manual'));
$('btn-manual-back').addEventListener('click', () => showScreen('screen-notoken'));

$('btn-manual-go').addEventListener('click', async () => {
  const val = $('manual-id-input').value.trim();
  if (!val) return;
  S.entityId = val;
  chrome.storage.local.set({lastEntityId: val});
  if (!S.token) { alert('No session token found. Open ClassPlus in a tab first and navigate to your course.'); return; }
  await fetchAll(true);
});

$('btn-new-folder').addEventListener('click', async () => {
  const name = prompt('Folder name:');
  if (name?.trim()) {
    S.folders.push(name.trim());
    await CPStorage.saveFolders(S.entityId, S.folders);
    renderFoldersList();
  }
});

// Settings - preference toggles
document.querySelectorAll('.toggle-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const pref = btn.dataset.pref;
    const val  = btn.dataset.val;
    setPref(pref, val);
  });
});

async function populateSettings() {
  const auth = await CPStorage.getAuth();
  $('set-entity').textContent  = S.entityId || auth.lastEntityId || '—';
  const age = auth.tokenCapturedAt ? Math.round((Date.now()-auth.tokenCapturedAt)/60000)+'m ago' : '—';
  $('set-token').textContent   = auth.authToken ? `✓ Captured (${age})` : '✗ Not found';
  const cached = await CPStorage.getLectures(S.entityId||'');
  $('set-cached').textContent  = cached.length + ' lectures';
  const lf = await CPStorage.getLastFetched(S.entityId||'');
  $('set-fetched').textContent = lf ? new Date(lf).toLocaleString() : 'Never';
  applyPrefs(); // sync toggle states
}

$('btn-refetch').addEventListener('click', async () => { await fetchAll(true); });
$('btn-change-course').addEventListener('click', () => showScreen('screen-manual'));
$('btn-clear').addEventListener('click', async () => {
  if (!confirm('Clear all data for this course?')) return;
  if (S.entityId) await CPStorage.clearEntityData(S.entityId);
  S.lectures=[]; S.userData={};
  showScreen('screen-notoken');
});

// Keyboard shortcut: Escape closes overlays / suggestions
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideAll();
  // Ctrl/Cmd+F focuses search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    $('search-input').focus();
  }
  // Ctrl/Cmd+G focuses jump
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    $('jump-input').focus();
  }
});

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  await loadPrefs();

  // Auto-detect system theme on first launch
  if (!localStorage.getItem('prefInit')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    S.prefs.theme = 'auto';
    await savePrefs();
    localStorage.setItem('prefInit', '1');
  }
  applyPrefs();

  showScreen('screen-loading');
  setLoad('Initializing…', 'Checking for session');

  const auth = await CPStorage.getAuth();
  S.token    = auth.authToken || null;
  S.entityId = auth.lastEntityId || null;

  if (!S.token) {
    await new Promise(r => setTimeout(r, 800));
    const auth2 = await CPStorage.getAuth();
    S.token    = auth2.authToken || null;
    S.entityId = auth2.lastEntityId || S.entityId;
  }

  if (!S.entityId) {
    try {
      const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
      if (tab?.url) {
        const m = tab.url.match(/entityId=(\d+)|\/course\/(\d+)|\/batch\/(\d+)/);
        if (m) S.entityId = m[1]||m[2]||m[3];
      }
    } catch(e) {}
  }

  if (!S.token || !S.entityId) {
    showScreen('screen-notoken');
    return;
  }

  await fetchAll();
}

init();
