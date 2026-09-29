/* flashcard.js — Bộ Flashcard cá nhân: tạo, sửa, xóa bộ; thêm/sửa/xóa thẻ; học bằng giao diện flashcard; yêu thích.
   Được hoctuvung.html nạp trước phần mã chính và khởi chạy qua window.HTS_MODULES. Dữ liệu lưu ở bảng public.flashcard_decks (xem supabase-decks.sql). */
(window.HTS_MODULES = window.HTS_MODULES || []).push(function (H) {
'use strict';
const {$, esc, str, uid, norm, ic, toast, askConfirm, ACT} = H;
const MAX_CARDS = 500, MAX_NAME = 60;

H.addIcons({
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13',
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  play: 'M5 3l14 9-14 9z',
  copy: 'M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'
});

/* ---------- Trạng thái & dữ liệu ---------- */
const D = {uid: null, decks: [], loaded: false, loading: false, error: '', tab: 'mine', busy: false};
const received = d => !!d.originCode;
const byId = id => D.decks.find(d => d.id === id) || null;
const curDeck = () => { const r = H.route(); return r.name === 'decks' && r.arg ? byId(r.arg) : null; };

function cleanCard(o, keepId) {
  if (!o || typeof o !== 'object') return null;
  const vi = str(o.vi, 120), en = str(o.en, 120);
  if (!vi || !en) return null;
  return {id: (keepId && typeof o.id === 'string' && o.id) ? str(o.id, 40) : uid(), vi: vi, en: en, def: str(o.def, 500), topic: str(o.topic, 40) || 'Khác'};
}
function cleanCards(a, keepId) {
  const seen = new Set(), out = [];
  (Array.isArray(a) ? a : []).forEach(c => {
    const k = cleanCard(c, keepId);
    if (!k) return;
    if (seen.has(k.id)) k.id = uid();
    seen.add(k.id);
    out.push(k);
  });
  return out.slice(0, MAX_CARDS);
}
function fromRow(r) {
  return {
    id: String(r.id), name: str(r.name, MAX_NAME) || 'Bộ thẻ', cards: cleanCards(r.cards, true),
    code: r.share_code || '', fav: r.favorite === true,
    originName: str(r.origin_name, MAX_NAME), originOwner: str(r.origin_owner, 40), originCode: r.origin_code || ''
  };
}
function errMsg(e) {
  const m = String(e && e.message || ''), c = String(e && e.code || '');
  if (c === '42P01' || c === 'PGRST205' || c === 'PGRST202' || /schema cache|does not exist/i.test(m))
    return 'Máy chủ chưa có bảng bộ thẻ. Hãy chạy tệp supabase-decks.sql trong Supabase SQL Editor.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
  if (c === '42501' || /row-level security|jwt/i.test(m)) return 'Phiên đăng nhập không còn hiệu lực hoặc không đủ quyền. Hãy đăng nhập lại.';
  return 'Không thực hiện được: ' + (m || 'lỗi không xác định');
}
function syncUser() {
  const u = H.user(), id = u ? u.id : null;
  if (D.uid !== id) { D.uid = id; D.decks = []; D.loaded = false; D.error = ''; }
  return u;
}
function put(row) {
  const d = fromRow(row), i = D.decks.findIndex(x => x.id === d.id);
  if (i >= 0) D.decks[i] = d; else D.decks.unshift(d);
  return d;
}
const inView = () => { const n = H.route().name; return n === 'decks' || n === 'deck'; };
async function load() {
  const u = syncUser();
  if (!u || D.loading) return;
  D.loading = true; D.error = '';
  try {
    const r = await H.sb().from('flashcard_decks').select('*').eq('owner_id', u.id).order('created_at', {ascending: false});
    if (r.error) throw r.error;
    if (D.uid === u.id) { D.decks = (r.data || []).map(fromRow); D.loaded = true; }
  } catch (e) { D.error = errMsg(e); }
  D.loading = false;
  if (inView()) H.refresh();
}
async function ensureLoaded() {
  if (!syncUser()) return false;
  if (!D.loaded) {
    if (D.loading) { while (D.loading) await new Promise(r => setTimeout(r, 80)); }
    else await load();
  }
  return D.loaded;
}
async function guard(fn) {
  if (D.busy) return undefined;
  D.busy = true;
  try { return await fn(); } finally { D.busy = false; }
}
function gone(deck) {
  D.decks = D.decks.filter(x => x.id !== deck.id);
  toast('Bộ thẻ này không còn tồn tại (có thể đã bị xóa ở nơi khác).', 'warn');
  const r = H.route();
  if (r.name === 'decks' && r.arg) H.go('decks'); else H.refresh();
}
async function update(deck, patch) {
  const u = H.user();
  if (!u) { toast('Hãy đăng nhập để tiếp tục.', 'warn'); return null; }
  const body = Object.assign({}, patch);
  if (!('favorite' in patch)) body.updated_at = new Date().toISOString();
  try {
    const r = await H.sb().from('flashcard_decks').update(body).eq('id', deck.id).eq('owner_id', u.id).select('*');
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) { gone(deck); return null; }
    return put(r.data[0]);
  } catch (e) { toast(errMsg(e), 'warn'); return null; }
}

/* ---------- Hộp thoại ---------- */
document.body.insertAdjacentHTML('beforeend',
  '<dialog id="dlgDeck" aria-labelledby="dkTitle"><form id="deckForm" class="dlg-box" novalidate>' +
    '<h2 id="dkTitle"></h2>' +
    '<label class="f">Tên bộ thẻ<input id="dkName" maxlength="60" autocomplete="off" required></label>' +
    '<p class="err" id="dkErr" role="alert" hidden></p>' +
    '<div class="row end"><button type="button" class="btn ghost" data-act="dk-cancel">Hủy</button><button type="submit" class="btn primary" id="dkOk">Lưu</button></div>' +
  '</form></dialog>' +
  '<dialog id="dlgCard" aria-labelledby="ckTitle"><form id="cardForm" class="dlg-box" novalidate>' +
    '<h2 id="ckTitle"></h2>' +
    '<label class="f">Tiếng Việt<input id="ckVi" maxlength="120" autocomplete="off" required></label>' +
    '<label class="f">Tiếng Anh<input id="ckEn" maxlength="120" autocomplete="off" lang="en" required></label>' +
    '<label class="f">Định nghĩa<textarea id="ckDef" rows="3" maxlength="500"></textarea></label>' +
    '<label class="f">Chủ đề<input id="ckTopic" list="ckTopicList" maxlength="40" autocomplete="off" placeholder="Chọn hoặc gõ chủ đề mới"></label>' +
    '<datalist id="ckTopicList"></datalist>' +
    '<p class="err" id="ckErr" role="alert" hidden></p>' +
    '<div class="row end"><button type="button" class="btn ghost" data-act="ck-cancel">Hủy</button><button type="submit" class="btn primary" id="ckOk">Lưu thẻ</button></div>' +
  '</form></dialog>');
['dlgDeck', 'dlgCard'].forEach(id => {
  const d = document.getElementById(id);
  d.addEventListener('click', e => { if (e.target === d) d.close(); });
});

function openDeckDlg(id) {
  const d = id ? byId(id) : null;
  $('#dkTitle').textContent = d ? 'Đổi tên bộ thẻ' : 'Tạo bộ thẻ mới';
  $('#dkName').value = d ? d.name : '';
  $('#dkErr').hidden = true;
  $('#deckForm').dataset.id = d ? d.id : '';
  $('#dlgDeck').showModal();
  $('#dkName').focus();
}
$('#deckForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = e.target.dataset.id, name = str($('#dkName').value, MAX_NAME), err = $('#dkErr'), btn = $('#dkOk');
  const fail = m => { err.textContent = m; err.hidden = false; };
  if (!name) return fail('Hãy đặt tên cho bộ thẻ.');
  if (!H.user()) return fail('Hãy đăng nhập để tạo bộ thẻ.');
  if (D.decks.some(d => d.id !== id && norm(d.name) === norm(name))) return fail('Bạn đã có một bộ thẻ trùng tên này.');
  err.hidden = true; btn.disabled = true;
  await guard(async () => {
    try {
      if (id) {
        const d = byId(id);
        if (!d) return fail('Bộ thẻ không còn tồn tại.');
        const nd = await update(d, {name: name});
        if (nd) { $('#dlgDeck').close(); toast('Đã đổi tên bộ thẻ.'); H.refresh(); }
      } else {
        const r = await H.sb().from('flashcard_decks').insert({owner_id: H.user().id, name: name}).select('*').single();
        if (r.error) throw r.error;
        const nd = put(r.data);
        $('#dlgDeck').close(); toast('Đã tạo bộ thẻ mới.'); H.go('decks/' + nd.id);
      }
    } catch (x) { fail(errMsg(x)); }
  });
  btn.disabled = false;
});

function openCardDlg(cardId) {
  const deck = curDeck();
  if (!deck) return;
  const c = cardId ? deck.cards.find(x => x.id === cardId) : null;
  if (cardId && !c) return;
  $('#ckTitle').textContent = c ? 'Sửa thẻ' : 'Thêm thẻ mới';
  $('#ckVi').value = c ? c.vi : ''; $('#ckEn').value = c ? c.en : '';
  $('#ckDef').value = c ? c.def : ''; $('#ckTopic').value = c ? c.topic : '';
  $('#ckErr').hidden = true;
  const f = $('#cardForm'); f.dataset.deck = deck.id; f.dataset.card = c ? c.id : '';
  const topics = Array.from(new Set(H.topics.concat(deck.cards.map(x => x.topic))));
  $('#ckTopicList').innerHTML = topics.map(t => '<option value="' + esc(t) + '"></option>').join('');
  $('#dlgCard').showModal();
  $('#ckVi').focus();
}
$('#cardForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, cid = f.dataset.card, deck = byId(f.dataset.deck), err = $('#ckErr');
  const fail = m => { err.textContent = m; err.hidden = false; };
  if (!deck) return fail('Bộ thẻ không còn tồn tại.');
  const c = {vi: str($('#ckVi').value, 120), en: str($('#ckEn').value, 120), def: str($('#ckDef').value, 500), topic: str($('#ckTopic').value, 40) || 'Khác'};
  if (!c.vi || !c.en) return fail('Nhập đủ tiếng Việt và tiếng Anh.');
  if (deck.cards.some(x => x.id !== cid && norm(x.vi) === norm(c.vi) && norm(x.en) === norm(c.en))) return fail('Thẻ này đã có trong bộ.');
  if (!cid && deck.cards.length >= MAX_CARDS) return fail('Mỗi bộ tối đa ' + MAX_CARDS + ' thẻ.');
  err.hidden = true; $('#ckOk').disabled = true;
  await guard(async () => {
    const cards = deck.cards.slice();
    if (cid) {
      const i = cards.findIndex(x => x.id === cid);
      if (i < 0) return fail('Thẻ không còn tồn tại.');
      cards[i] = Object.assign({}, cards[i], c);
    } else cards.push(Object.assign({id: uid()}, c));
    const nd = await update(deck, {cards: cards});
    if (nd) { $('#dlgCard').close(); toast(cid ? 'Đã cập nhật thẻ.' : 'Đã thêm thẻ.'); H.refresh(); }
  });
  $('#ckOk').disabled = false;
});

/* ---------- Giao diện ---------- */
const head = (t, sub, btns) => '<div class="page-head"><div><h1>' + t + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (btns ? '<div class="row">' + btns + '</div>' : '') + '</div>';
const msg = (t, body, btn) => '<div class="card center"><h2>' + t + '</h2>' + (body ? '<p class="muted"' + (btn ? ' style="margin-bottom:14px"' : '') + '>' + body + '</p>' : '') + (btn || '') + '</div>';
const ibtn = (act, id, icon, label, cls, pressed) => '<button type="button" class="icon-btn' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" data-id="' + esc(id) + '" aria-label="' + esc(label) + '" title="' + esc(label) + '"' + (pressed === undefined ? '' : ' aria-pressed="' + pressed + '"') + '>' + ic(icon) + '</button>';
const joinBox = () => H.share ? H.share.joinHTML() : '';

function deckRow(d) {
  const meta = '<span class="tag">' + d.cards.length + ' thẻ</span>' +
    (received(d) ? '<span class="tag">Từ ' + esc(d.originOwner || 'người dùng khác') + '</span>' : '') +
    (d.code ? '<span class="badge ok">Đang chia sẻ</span>' : '');
  return '<article class="word"><div><div class="w-terms"><a class="dk-name" href="#decks/' + esc(d.id) + '">' + esc(d.name) + '</a></div><div class="w-meta">' + meta + '</div></div>' +
    '<div class="w-actions">' +
    ibtn('deck-study', d.id, 'play', 'Học bộ này') +
    ibtn('deck-fav', d.id, 'star', d.fav ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích', 'fav' + (d.fav ? ' on' : ''), d.fav) +
    (H.share ? ibtn('deck-share', d.id, 'share', 'Chia sẻ') : '') +
    '<a class="icon-btn" href="#decks/' + esc(d.id) + '" aria-label="Mở và chỉnh sửa ' + esc(d.name) + '" title="Mở và chỉnh sửa">' + ic('edit') + '</a>' +
    ibtn('deck-del', d.id, 'trash', 'Xóa bộ thẻ', 'del') + '</div></article>';
}
function paintList(root) {
  const tabs = [
    ['mine', 'Bộ của tôi', D.decks.filter(d => !received(d))],
    ['received', 'Bộ đã nhận', D.decks.filter(received)],
    ['fav', 'Yêu thích', D.decks.filter(d => d.fav)]
  ];
  if (!tabs.some(t => t[0] === D.tab)) D.tab = 'mine';
  const empty = {
    mine: 'Bạn chưa có bộ thẻ nào. Bấm "Tạo bộ mới" để bắt đầu.',
    received: 'Chưa có bộ nào được sao chép từ người khác. Nhập mã hoặc mở liên kết chia sẻ để nhận bộ thẻ.',
    fav: 'Chưa có bộ yêu thích. Bấm biểu tượng ngôi sao ở mỗi bộ để đánh dấu.'
  }[D.tab];
  const list = tabs.find(t => t[0] === D.tab)[2];
  root.innerHTML = head('Bộ Flashcard của tôi', 'Tạo bộ thẻ riêng, học bằng giao diện flashcard và chia sẻ cho người khác.',
      '<button class="btn primary" type="button" data-act="deck-new">' + ic('plus') + 'Tạo bộ mới</button>') +
    '<div class="seg" role="tablist">' + tabs.map(t => '<button type="button" class="btn sm' + (D.tab === t[0] ? ' primary' : '') + '" role="tab" aria-selected="' + (D.tab === t[0]) + '" data-act="deck-tab" data-tab="' + t[0] + '">' + t[1] + ' (' + t[2].length + ')</button>').join('') + '</div>' +
    '<div class="words">' + (list.length ? list.map(deckRow).join('') : '<p class="empty">' + empty + '</p>') + '</div>' + joinBox();
}
function cardRow(c) {
  return '<article class="word"><div><div class="w-terms"><strong>' + esc(c.vi) + '</strong><span class="en">' + esc(c.en) + '</span></div>' +
    '<p class="w-def">' + (c.def ? esc(c.def) : 'Chưa có định nghĩa.') + '</p>' +
    '<div class="w-meta"><span class="tag">' + esc(c.topic) + '</span></div></div>' +
    '<div class="w-actions">' + ibtn('card-speak', c.id, 'speaker', 'Phát âm ' + c.en) + ibtn('card-edit', c.id, 'edit', 'Sửa thẻ') + ibtn('card-del', c.id, 'trash', 'Xóa thẻ', 'del') + '</div></article>';
}
function paintDetail(root, id) {
  const d = byId(id);
  if (!d) {
    root.innerHTML = head('Không tìm thấy bộ thẻ') + msg('Bộ thẻ không tồn tại', 'Bộ này không có trong tài khoản của bạn hoặc đã bị xóa.', '<a class="btn" href="#decks">Về danh sách bộ thẻ</a>');
    return;
  }
  const sub = (received(d) ? 'Sao chép từ ' + esc(d.originOwner || 'người dùng khác') + (d.originName && d.originName !== d.name ? ' (bộ "' + esc(d.originName) + '")' : '') + '. Sửa bản sao không làm thay đổi bộ gốc. ' : '') +
    d.cards.length + ' thẻ' + (d.code ? ' · Đang chia sẻ, mã <b>' + esc(d.code) + '</b>' : '');
  const b = (act, icon, label, cls) => '<button class="btn ' + (cls || '') + '" type="button" data-act="' + act + '" data-id="' + esc(d.id) + '">' + (icon ? ic(icon) : '') + label + '</button>';
  root.innerHTML = '<p style="margin:0 0 10px"><a class="btn ghost sm" href="#decks">' + ic('left') + 'Tất cả bộ thẻ</a></p>' +
    head(esc(d.name), sub,
      b('deck-study', 'play', 'Học bộ này', 'primary') + b('card-add', 'plus', 'Thêm thẻ') + (H.share ? b('deck-share', 'share', 'Chia sẻ') : '') +
      b('deck-rename', 'edit', 'Đổi tên') + b('deck-del', 'trash', 'Xóa bộ', 'danger')) +
    '<div class="words">' + (d.cards.length ? d.cards.map(cardRow).join('') : '<p class="empty">Bộ này chưa có thẻ nào. Bấm "Thêm thẻ" để tạo thẻ đầu tiên.</p>') + '</div>';
}
function paintDecks(arg) {
  const u = syncUser(), root = $('#view-decks'), title = 'Bộ Flashcard của tôi';
  if (!H.enabled()) {
    root.innerHTML = head(title) + msg('Chưa bật tính năng tài khoản', 'Thiếu supabase-config.js hoặc không tải được thư viện Supabase, nên chưa thể lưu bộ thẻ.');
    return;
  }
  if (!u) {
    root.innerHTML = head(title, 'Tạo bộ thẻ riêng, học bằng giao diện flashcard và chia sẻ cho người khác.') +
      (H.acctLoading() ? msg('Đang tải tài khoản…', '') : msg('Cần đăng nhập', 'Hãy đăng nhập để tạo và lưu bộ Flashcard của riêng bạn.', '<button class="btn primary" type="button" data-act="acct">' + ic('user') + 'Đăng nhập / Đăng ký</button>')) + joinBox();
    return;
  }
  if (!D.loaded) {
    if (D.error) root.innerHTML = head(title) + msg('Không tải được bộ thẻ', esc(D.error), '<button class="btn" type="button" data-act="deck-reload">Thử lại</button>') + joinBox();
    else { root.innerHTML = head(title) + msg('Đang tải bộ thẻ…', ''); if (!D.loading) load(); }
    return;
  }
  if (arg) paintDetail(root, arg); else paintList(root);
}

/* ---------- Thao tác ---------- */
function studyDeck(d) {
  if (!d.cards.length) { toast('Bộ này chưa có thẻ nào. Hãy thêm thẻ trước khi học.', 'warn'); return; }
  const r = H.route();
  H.study(d.name, d.cards, r.name === 'decks' && r.arg ? 'decks/' + d.id : 'decks');
}
Object.assign(ACT, {
  'deck-new': () => openDeckDlg(),
  'deck-rename': el => openDeckDlg(el.dataset.id),
  'dk-cancel': () => $('#dlgDeck').close(),
  'ck-cancel': () => $('#dlgCard').close(),
  'deck-tab': el => { D.tab = el.dataset.tab; H.refresh(); },
  'deck-reload': () => { D.error = ''; load(); H.refresh(); },
  'deck-study': el => { const d = byId(el.dataset.id); if (d) studyDeck(d); },
  'deck-share': el => { const d = byId(el.dataset.id); if (d && H.share) H.share.open(d); },
  'deck-fav': el => {
    const d = byId(el.dataset.id);
    if (!d) return;
    guard(async () => { const nd = await update(d, {favorite: !d.fav}); if (nd) H.refresh(); });
  },
  'deck-del': async el => {
    const d = byId(el.dataset.id);
    if (!d) return;
    const extra = d.code ? ' Liên kết và mã chia sẻ của bộ này cũng sẽ ngừng hoạt động.' : '';
    if (!(await askConfirm('Xóa bộ thẻ?', 'Bộ "' + d.name + '" cùng ' + d.cards.length + ' thẻ sẽ bị xóa vĩnh viễn.' + extra, 'Xóa'))) return;
    await guard(async () => {
      try {
        const r = await H.sb().from('flashcard_decks').delete().eq('id', d.id).eq('owner_id', H.user().id);
        if (r.error) throw r.error;
        D.decks = D.decks.filter(x => x.id !== d.id);
        toast('Đã xóa bộ thẻ.');
        if (H.route().arg) H.go('decks'); else H.refresh();
      } catch (e) { toast(errMsg(e), 'warn'); }
    });
  },
  'card-add': () => openCardDlg(),
  'card-edit': el => openCardDlg(el.dataset.id),
  'card-del': async el => {
    const d = curDeck(), c = d && d.cards.find(x => x.id === el.dataset.id);
    if (!c) return;
    if (!(await askConfirm('Xóa thẻ này?', '"' + c.vi + ' / ' + c.en + '" sẽ bị xóa khỏi bộ.', 'Xóa'))) return;
    await guard(async () => {
      const nd = await update(d, {cards: d.cards.filter(x => x.id !== c.id)});
      if (nd) { toast('Đã xóa thẻ.'); H.refresh(); }
    });
  },
  'card-speak': el => { const d = curDeck(), c = d && d.cards.find(x => x.id === el.dataset.id); if (c) H.speak(c.en); }
});

H.decks = {
  byId: byId, put: put, fromRow: fromRow, cleanCards: cleanCards, errMsg: errMsg, update: update, gone: gone, guard: guard,
  ensureLoaded: ensureLoaded, list: () => D.decks, loadError: () => D.error, setTab: t => { D.tab = t; }
};
H.registerView({id: 'decks', title: 'Bộ Flashcard của tôi', nav: 'Bộ thẻ', icon: 'folder', after: 'flash', paint: paintDecks});
});
