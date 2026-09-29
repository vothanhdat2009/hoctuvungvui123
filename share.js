/* share.js — Chia sẻ bộ Flashcard: tạo mã/liên kết duy nhất, xem bộ được chia sẻ (#deck/MÃ) và sao chép về tài khoản.
   Phải nạp sau flashcard.js. Người nhận chỉ có bản sao độc lập; sửa bản sao không ảnh hưởng bộ gốc. */
(window.HTS_MODULES = window.HTS_MODULES || []).push(function (H) {
'use strict';
const K = H.decks;
if (!K) return;
const {$, esc, str, ic, toast, askConfirm, ACT} = H;
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
const S = {code: '', uid: null, state: 'idle', deck: null, error: '', seq: 0};

function newCode() {
  const b = new Uint8Array(8);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 8; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b, x => ALPHA[x % 32]).join('');
}
function parseCode(s) {
  s = String(s || '').trim();
  const m = s.match(/deck\/([A-Za-z0-9]+)/i);
  return (m ? m[1] : s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}
const linkFor = code => location.href.split('#')[0] + '#deck/' + code;

/* ---------- Chia sẻ bộ của mình ---------- */
document.body.insertAdjacentHTML('beforeend',
  '<dialog id="dlgShare" aria-labelledby="shTitle"><div class="dlg-box">' +
    '<h2 id="shTitle">Chia sẻ bộ thẻ</h2><p id="shName"></p>' +
    '<label class="f codebox">Mã chia sẻ<input id="shCode" readonly></label>' +
    '<label class="f">Liên kết<input id="shLink" readonly></label>' +
    '<p>Ai có mã hoặc liên kết đều xem được nội dung hiện tại của bộ và có thể sao chép về tài khoản của họ. Bản sao là bản riêng: họ sửa không làm thay đổi bộ của bạn.</p>' +
    '<div class="row end">' +
      '<button type="button" class="btn ghost" data-act="sh-close">Đóng</button>' +
      '<button type="button" class="btn" data-act="sh-copy-code">' + ic('copy') + 'Chép mã</button>' +
      '<button type="button" class="btn primary" data-act="sh-copy-link">' + ic('copy') + 'Chép liên kết</button>' +
      '<button type="button" class="btn danger" data-act="sh-stop">Ngừng chia sẻ</button>' +
    '</div></div></dialog>');
$('#dlgShare').addEventListener('click', e => { if (e.target === $('#dlgShare')) $('#dlgShare').close(); });

async function enable(deck) {
  const u = H.user();
  if (!u) { toast('Hãy đăng nhập để chia sẻ.', 'warn'); return null; }
  try {
    for (let i = 0; i < 6; i++) {
      const r = await H.sb().from('flashcard_decks').update({share_code: newCode(), updated_at: new Date().toISOString()}).eq('id', deck.id).eq('owner_id', u.id).select('*');
      if (r.error) { if (r.error.code === '23505') continue; throw r.error; }
      if (!r.data || !r.data.length) { K.gone(deck); return null; }
      const nd = K.put(r.data[0]);
      H.refresh();
      return nd;
    }
    toast('Không tạo được mã duy nhất. Hãy thử lại.', 'warn');
  } catch (e) { toast(K.errMsg(e), 'warn'); }
  return null;
}
function showShare(d) {
  $('#shName').textContent = 'Bộ thẻ: ' + d.name + ' (' + d.cards.length + ' thẻ)';
  $('#shCode').value = d.code; $('#shLink').value = linkFor(d.code);
  $('#dlgShare').dataset.id = d.id;
  $('#dlgShare').showModal();
}
async function openShare(deck) {
  if (!deck) return;
  if (!deck.cards.length) { toast('Bộ thẻ đang trống. Hãy thêm ít nhất một thẻ trước khi chia sẻ.', 'warn'); return; }
  const d = deck.code ? deck : await K.guard(() => enable(deck));
  if (d) showShare(d);
}
async function copyText(text, input) {
  try { await navigator.clipboard.writeText(text); toast('Đã sao chép.'); return; } catch (e) {}
  try { input.focus(); input.select(); if (document.execCommand('copy')) { toast('Đã sao chép.'); return; } } catch (e) {}
  toast('Không sao chép tự động được. Hãy chọn và sao chép thủ công.', 'warn');
}

/* ---------- Ô nhập mã ---------- */
H.share = {
  open: openShare,
  joinHTML: () => '<form class="card joinForm" novalidate style="margin-top:16px"><div class="row" style="align-items:flex-end">' +
    '<label class="f" style="flex:1;min-width:200px">Có mã hoặc liên kết chia sẻ?<input maxlength="200" autocomplete="off" spellcheck="false" placeholder="Dán mã 8 ký tự hoặc liên kết"></label>' +
    '<button class="btn primary" type="submit">Mở bộ thẻ</button></div><p class="err" role="alert" hidden></p></form>'
};
document.addEventListener('submit', e => {
  const f = e.target;
  if (!f.classList || !f.classList.contains('joinForm')) return;
  e.preventDefault();
  const code = parseCode(f.querySelector('input').value), err = f.querySelector('.err');
  if (!CODE_RE.test(code)) { err.textContent = 'Mã không hợp lệ. Mã chia sẻ gồm 8 ký tự chữ và số.'; err.hidden = false; return; }
  err.hidden = true;
  H.go('deck/' + code);
});

/* ---------- Xem bộ được chia sẻ ---------- */
const head = (t, sub, btns) => '<div class="page-head"><div><h1>' + t + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (btns ? '<div class="row">' + btns + '</div>' : '') + '</div>';
const msg = (t, body, btn) => '<div class="card center"><h2>' + t + '</h2><p class="muted"' + (btn ? ' style="margin-bottom:14px"' : '') + '>' + body + '</p>' + (btn || '') + '</div>';
const backBtn = '<a class="btn" href="#decks">Về Bộ thẻ của tôi</a>';

async function fetchDeck(code, my) {
  try {
    const r = await H.sb().rpc('get_shared_deck', {p_code: code});
    if (r.error) throw r.error;
    if (S.seq !== my) return;
    const row = Array.isArray(r.data) ? r.data[0] : r.data;
    if (!row) { S.state = 'notfound'; }
    else {
      S.deck = {name: str(row.name, 60) || 'Bộ thẻ', owner: str(row.owner_name, 40) || 'người dùng khác', cards: K.cleanCards(row.cards, true), mine: row.is_owner === true};
      S.state = 'ok';
    }
  } catch (e) {
    if (S.seq !== my) return;
    S.state = 'error'; S.error = K.errMsg(e);
  }
  const r = H.route();
  if (r.name === 'deck' && parseCode(r.arg) === code) H.refresh();
}
function paintShared(arg) {
  const root = $('#view-deck'), code = parseCode(arg), u = H.user(), id = u ? u.id : null;
  if (!H.enabled()) {
    root.innerHTML = head('Bộ thẻ được chia sẻ') + msg('Chưa bật tính năng tài khoản', 'Thiếu supabase-config.js hoặc không tải được thư viện Supabase, nên chưa thể mở bộ thẻ được chia sẻ.', backBtn);
    return;
  }
  if (!CODE_RE.test(code)) {
    root.innerHTML = head('Bộ thẻ được chia sẻ') + msg('Mã không hợp lệ', 'Mã chia sẻ gồm 8 ký tự chữ và số. Hãy kiểm tra lại mã hoặc liên kết bạn nhận được.', backBtn) + H.share.joinHTML();
    return;
  }
  if (S.code !== code || S.uid !== id) { S.code = code; S.uid = id; S.deck = null; S.state = 'loading'; S.error = ''; fetchDeck(code, ++S.seq); }
  if (S.state === 'loading') { root.innerHTML = head('Bộ thẻ được chia sẻ') + msg('Đang mở bộ thẻ…', ''); return; }
  if (S.state === 'notfound') {
    root.innerHTML = head('Bộ thẻ được chia sẻ') + msg('Không tìm thấy bộ thẻ', 'Mã hoặc liên kết này không tồn tại, hoặc chủ bộ thẻ đã xóa bộ hoặc ngừng chia sẻ.', backBtn) + H.share.joinHTML();
    return;
  }
  if (S.state === 'error') {
    root.innerHTML = head('Bộ thẻ được chia sẻ') + msg('Không mở được bộ thẻ', esc(S.error), '<button class="btn" type="button" data-act="share-retry">Thử lại</button>');
    return;
  }
  const d = S.deck;
  let main;
  if (d.mine) main = '<button class="btn primary" type="button" data-act="share-openown">Mở trong Bộ của tôi</button>';
  else if (u) main = '<button class="btn primary" type="button" data-act="share-copy">' + ic('copy') + 'Sao chép vào tài khoản của tôi</button>';
  else if (H.acctLoading()) main = '<button class="btn primary" type="button" disabled>Đang tải tài khoản…</button>';
  else main = '<button class="btn primary" type="button" data-act="acct">' + ic('user') + 'Đăng nhập để sao chép</button>';
  const note = d.mine ? 'Đây là bộ thẻ của bạn.' : (u ? 'Khi sao chép, bạn nhận một bản riêng trong mục "Bộ đã nhận". Chỉnh sửa bản sao không làm thay đổi bộ gốc.' : 'Bạn có thể xem và học thử ngay. Đăng nhập để lưu bản sao vào tài khoản.');
  root.innerHTML = '<p style="margin:0 0 10px"><a class="btn ghost sm" href="#decks">' + ic('left') + 'Bộ thẻ của tôi</a></p>' +
    head(esc(d.name), 'Chia sẻ bởi <b>' + esc(d.owner) + '</b> · ' + d.cards.length + ' thẻ',
      main + '<button class="btn" type="button" data-act="share-study">' + ic('play') + 'Học thử</button>') +
    '<p class="hint" style="margin:0 0 6px">' + note + '</p>' +
    '<div class="words">' + (d.cards.length ? d.cards.map(c =>
      '<article class="word"><div><div class="w-terms"><strong>' + esc(c.vi) + '</strong><span class="en">' + esc(c.en) + '</span></div>' +
      '<p class="w-def">' + (c.def ? esc(c.def) : 'Chưa có định nghĩa.') + '</p><div class="w-meta"><span class="tag">' + esc(c.topic) + '</span></div></div>' +
      '<div class="w-actions"><button type="button" class="icon-btn" data-act="share-speak" data-id="' + esc(c.id) + '" aria-label="Phát âm ' + esc(c.en) + '" title="Phát âm">' + ic('speaker') + '</button></div></article>').join('')
      : '<p class="empty">Bộ thẻ này hiện chưa có thẻ nào.</p>') + '</div>';
}

Object.assign(ACT, {
  'sh-close': () => $('#dlgShare').close(),
  'sh-copy-code': () => copyText($('#shCode').value, $('#shCode')),
  'sh-copy-link': () => copyText($('#shLink').value, $('#shLink')),
  'sh-stop': async () => {
    const d = K.byId($('#dlgShare').dataset.id);
    if (!d) { $('#dlgShare').close(); return; }
    if (!(await askConfirm('Ngừng chia sẻ?', 'Mã và liên kết hiện tại sẽ ngừng hoạt động. Những bản sao người khác đã lưu vẫn được giữ nguyên.', 'Ngừng chia sẻ'))) return;
    const nd = await K.guard(() => K.update(d, {share_code: null}));
    if (nd) { $('#dlgShare').close(); toast('Đã ngừng chia sẻ bộ thẻ.'); H.refresh(); }
  },
  'share-retry': () => { S.code = ''; H.refresh(); },
  'share-speak': el => { const c = S.deck && S.deck.cards.find(x => x.id === el.dataset.id); if (c) H.speak(c.en); },
  'share-study': () => {
    if (!S.deck) return;
    if (!S.deck.cards.length) { toast('Bộ thẻ này chưa có thẻ nào.', 'warn'); return; }
    H.study(S.deck.name, S.deck.cards, 'deck/' + S.code);
  },
  'share-openown': async () => {
    if (!(await K.ensureLoaded())) { toast(K.loadError() || 'Không tải được danh sách bộ thẻ của bạn.', 'warn'); return; }
    const o = K.list().find(x => x.code === S.code);
    if (o) H.go('decks/' + o.id); else toast('Bộ thẻ này không còn được chia sẻ hoặc đã bị xóa.', 'warn');
  },
  'share-copy': async () => {
    const d = S.deck, u = H.user();
    if (!d || !S.code) return;
    if (!u) { toast('Hãy đăng nhập để sao chép bộ thẻ.', 'warn'); ACT.acct(); return; }
    if (!(await K.ensureLoaded())) { toast(K.loadError() || 'Không tải được danh sách bộ thẻ của bạn.', 'warn'); return; }
    const code = S.code;
    if (K.list().some(x => x.originCode === code) && !(await askConfirm('Đã có bản sao', 'Bạn đã sao chép bộ này trước đó. Tạo thêm một bản sao nữa?', 'Sao chép thêm'))) return;
    await K.guard(async () => {
      try {
        const r = await H.sb().from('flashcard_decks').insert({
          owner_id: u.id, name: d.name, cards: K.cleanCards(d.cards, false),
          origin_name: d.name, origin_owner: d.owner, origin_code: code
        }).select('*').single();
        if (r.error) throw r.error;
        const nd = K.put(r.data);
        K.setTab('received');
        toast('Đã sao chép vào mục "Bộ đã nhận".');
        H.go('decks/' + nd.id);
      } catch (e) { toast(K.errMsg(e), 'warn'); }
    });
  }
});

window.addEventListener('hashchange', () => {
  if (H.route().name !== 'deck') { S.code = ''; S.deck = null; S.state = 'idle'; }
});
H.registerView({id: 'deck', title: 'Bộ thẻ được chia sẻ', navAs: 'decks', paint: paintShared});
});
