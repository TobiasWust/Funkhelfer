import { SERVICES, CTCSS, AIR_TO_AIR, fmt, service, tone } from './data.js';

const VERSION = '2.2.0';
const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privat-modus */ } },
};

let tab = store.get('tab', 'pmr');
let group = store.get('group', null); // { svc, ch, tone }
let sheetItem = null;

// ---------- Helfer ----------
const freqText = (s, c) => `${fmt(c.mhz, c.digits)} MHz`;
const toneText = (n) => (n ? `CTCSS ${n} · ${fmt(tone(n).hz, 1)} Hz` : 'ohne CTCSS');
const shareUrl = (g) => {
  const u = new URL(location.href.split(/[?#]/)[0]);
  u.searchParams.set('k', `${g.svc}${g.ch}`);
  if (g.tone) u.searchParams.set('t', g.tone);
  return u.toString();
};
const groupText = (g) => {
  const s = service(g.svc), c = s.channels[g.ch - 1];
  return `${s.short} ${g.ch} (${freqText(s, c)})${g.tone ? `, CTCSS ${g.tone} (${fmt(tone(g.tone).hz, 1)} Hz)` : ''}`;
};
const valid = (g) => g && service(g.svc) && service(g.svc).channels[g.ch - 1] && (!g.tone || tone(g.tone));

function toast(msg, action) {
  const t = $('#toast');
  t.replaceChildren(msg);
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.addEventListener('click', action.run);
    t.append(b);
  }
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), action ? 10000 : 2600);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Kopiert'); } catch { toast(text); }
}

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---------- Gruppenkanal ----------
function renderGroup() {
  const box = $('#group');
  box.replaceChildren();
  if (!valid(group)) {
    box.classList.add('group--empty');
    box.append(
      el('p', 'group__label', 'Unser Kanal'),
      el('p', 'group__hint', 'Tippe unten auf einen Kanal und merk ihn dir als Gruppenkanal. Dann kannst du ihn mit einem Tipp an alle schicken.'),
    );
    return;
  }
  box.classList.remove('group--empty');
  const s = service(group.svc), c = s.channels[group.ch - 1];
  const main = el('button', 'group__main');
  main.type = 'button';
  main.setAttribute('aria-label', `Großanzeige: ${groupText(group)}`);
  main.append(
    el('span', 'group__label', 'Unser Kanal'),
    el('span', 'group__ch', `${s.short} ${group.ch}`),
    el('span', 'group__freq', freqText(s, c)),
    el('span', 'group__tone', toneText(group.tone)),
  );
  main.addEventListener('click', openBig);

  const actions = el('div', 'group__actions');
  const share = el('button', 'btn btn--light', 'Teilen');
  share.addEventListener('click', shareGroup);
  const big = el('button', 'btn btn--light', 'Groß');
  big.addEventListener('click', openBig);
  const edit = el('button', 'btn btn--light', 'Ändern');
  edit.addEventListener('click', () => openSheet(s, c));
  actions.append(share, big, edit);
  box.append(main, actions);
}

function setGroup(g, silent) {
  group = g;
  store.set('group', g);
  renderGroup();
  renderList();
  if (!silent) toast(`Gruppenkanal: ${groupText(g)}`);
}

async function shareGroup() {
  const text = `Funk heute: ${groupText(group)}`;
  const url = shareUrl(group);
  if (navigator.share) {
    try { await navigator.share({ title: 'Unser Funkkanal', text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  copy(`${text}\n${url}`);
}

// ---------- Großanzeige ----------
let wakeLock = null;
async function openBig() {
  if (!valid(group)) return;
  const s = service(group.svc), c = s.channels[group.ch - 1];
  $('#bigService').textContent = s.label;
  $('#bigCh').textContent = `Kanal ${group.ch}`;
  $('#bigFreq').textContent = freqText(s, c);
  $('#bigTone').textContent = toneText(group.tone);
  $('#big').showModal();
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* egal */ }
}
$('#big').addEventListener('close', () => { wakeLock?.release(); wakeLock = null; });
$('#big').addEventListener('click', (e) => { if (e.target.id === 'big' || e.target.closest('.big__inner')) $('#big').close(); });

// ---------- Detail-Sheet ----------
const toneSelect = $('#toneSelect');
toneSelect.append(new Option('ohne CTCSS', '0'), ...CTCSS.map((t) => new Option(`${t.ch} · ${fmt(t.hz, 1)} Hz`, String(t.ch))));

function openSheet(s, c) {
  sheetItem = { s, c };
  if (s) {
    $('#sheetKicker').textContent = s.label;
    $('#sheetTitle').textContent = `Kanal ${c.ch}`;
    $('#sheetBig').textContent = freqText(s, c);
    $('#sheetTones').hidden = false;
    const same = group && group.svc === s.id && group.ch === c.ch;
    toneSelect.value = String(same ? group.tone || 0 : group?.tone || 0);
    $('#sheetSet').textContent = same ? 'Gruppenkanal aktualisieren' : 'Als Gruppenkanal merken';
  } else {
    $('#sheetKicker').textContent = 'CTCSS-Unterkanal';
    $('#sheetTitle').textContent = `Code ${c.ch}`;
    $('#sheetBig').textContent = `${fmt(c.hz, 1)} Hz`;
    $('#sheetTones').hidden = true;
    $('#sheetSet').textContent = valid(group) ? 'Für Gruppenkanal verwenden' : 'Als Gruppen-CTCSS merken';
  }
  $('#sheet').showModal();
}

$('#sheetSet').addEventListener('click', () => {
  const { s, c } = sheetItem;
  if (s) setGroup({ svc: s.id, ch: c.ch, tone: Number(toneSelect.value) || 0 });
  else if (valid(group)) setGroup({ ...group, tone: c.ch });
  else setGroup({ svc: 'pmr', ch: 1, tone: c.ch });
  $('#sheet').close();
});
$('#sheetCopy').addEventListener('click', () => {
  const { s, c } = sheetItem;
  copy(s ? `${s.short} ${c.ch}: ${freqText(s, c)}` : `CTCSS ${c.ch}: ${fmt(c.hz, 1)} Hz`);
});
for (const d of ['#sheet', '#info', '#privacy', '#imprint']) {
  $(d).addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
}

// ---------- Liste ----------
function row({ s, c, showService }) {
  const li = el('li');
  const b = el('button', 'row');
  b.type = 'button';
  const active = s ? group?.svc === s.id && group?.ch === c.ch : group?.tone === c.ch;
  if (active) b.classList.add('row--active');
  const num = el('span', 'row__ch', String(c.ch));
  const main = el('span', 'row__main');
  if (showService) main.append(el('span', 'row__svc', s ? s.short : 'CTCSS'));
  main.append(el('span', 'row__val', s ? fmt(c.mhz, c.digits) : fmt(c.hz, 1)));
  const unit = el('span', 'row__unit', s ? 'MHz' : 'Hz');
  b.append(num, main, unit);
  if (c.tag) b.append(el('span', 'row__tag', c.tag));
  if (active) b.append(el('span', 'row__tag row__tag--group', 'unser'));
  b.addEventListener('click', () => openSheet(s, c));
  li.append(b);
  return li;
}

function search(q) {
  const norm = q.trim().replace(',', '.');
  if (!norm) return null;
  const out = [];
  const isNum = /^\d+$/.test(norm);
  for (const s of SERVICES) {
    for (const c of s.channels) {
      const f = c.mhz.toFixed(c.digits);
      if ((isNum && c.ch === Number(norm)) || (norm.length >= 3 && f.includes(norm))) out.push({ s, c, showService: true });
    }
  }
  for (const c of CTCSS) {
    const f = c.hz.toFixed(1);
    const byHz = norm.length >= 2 && parseFloat(norm) >= 60 && f.startsWith(norm);
    if ((isNum && c.ch === Number(norm)) || byHz) {
      out.push({ s: null, c, showService: true });
    }
  }
  return out;
}

function renderList() {
  const q = $('#search').value;
  const hits = search(q);
  const list = $('#list');
  document.body.classList.toggle('searching', !!hits);
  if (hits) {
    $('#note').textContent = hits.length ? `${hits.length} Treffer für „${q.trim()}“` : `Nichts gefunden für „${q.trim()}“`;
    list.replaceChildren(...hits.map(row));
    return;
  }
  if (tab === 'ctcss') {
    $('#note').textContent = '38 Unterkanäle. Gleicher Kanal + gleicher Code = ihr hört euch. Nicht privat, nur ein Filter.';
    list.replaceChildren(...CTCSS.map((c) => row({ s: null, c })));
  } else {
    const s = service(tab);
    $('#note').textContent = s.note;
    list.replaceChildren(...s.channels.map((c) => row({ s, c })));
  }
}

function setTab(t) {
  tab = t;
  store.set('tab', t);
  for (const b of document.querySelectorAll('[role=tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === t));
  if ($('#search').value) $('#search').value = '';
  renderList();
  window.scrollTo({ top: Math.min(window.scrollY, $('.tabs').offsetTop - 8) });
}

document.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#search').addEventListener('input', renderList);

// ---------- Infos ----------
$('#openInfo').addEventListener('click', () => $('#info').showModal());
// Datenschutz und Impressum (auch aus anderen Dialogen heraus)
document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
  const d = document.getElementById(b.dataset.open);
  b.closest('dialog.legal')?.close();
  if (!d.open) d.showModal();
  d.scrollTop = 0;
}));
$('#version').textContent = VERSION;
$('#airList').replaceChildren(...AIR_TO_AIR.map((a) => {
  const li = el('li');
  li.append(el('strong', '', `${a.mhz} MHz`), ` ${a.where}`);
  return li;
}));

// ---------- Link ?k=pmr12&t=7 übernehmen ----------
(function importFromUrl() {
  const p = new URLSearchParams(location.search);
  const k = p.get('k');
  if (!k) return;
  const m = /^([a-z]+)(\d+)$/.exec(k);
  const g = m && { svc: m[1], ch: Number(m[2]), tone: Number(p.get('t')) || 0 };
  history.replaceState(null, '', location.pathname);
  if (!valid(g)) { toast('Der Link enthält keinen gültigen Kanal.'); return; }
  const before = group;
  setGroup(g, true);
  tab = g.svc;
  toast(`Gruppenkanal übernommen: ${groupText(g)}`, before && valid(before) ? {
    label: 'Rückgängig', run: () => { setGroup(before, true); $('#toast').classList.remove('show'); },
  } : null);
})();

// ---------- Start ----------
renderGroup();
setTab(service(tab) || tab === 'ctcss' ? tab : 'pmr');

// ---------- PWA: Installieren und Updates ----------
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  $('#installBtn').hidden = false;
});
$('#installBtn').addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  $('#installBtn').hidden = true;
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const offer = (w) => toast('Neue Version verfügbar.', { label: 'Neu laden', run: () => w.postMessage('skipWaiting') });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
      });
    });
  });
  // Nur bei einem Update neu laden, nicht beim allerersten Besuch.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) { reloading = true; location.reload(); }
  });
}
