/* minigames.js — Trò chơi ôn từ vựng: Ghép cặp, Chọn nhanh, Gõ từ.
   Phải nạp sau hoctuvung.html phần lõi (qua window.HTS_MODULES). Dùng trực tiếp danh sách từ hiện có (H.words()), không ghi thêm dữ liệu. */
(window.HTS_MODULES = window.HTS_MODULES || []).push(function (H) {
'use strict';
if (!H.words) return;
const {$, esc, ic, toast, norm, ACT} = H;
const ROUND = 10, T_MAX = 10000;

H.addIcons({play: 'M6 3l14 9-14 9z', gamepad: 'M6 12h4 M8 10v4 M15 13h.01 M18 11h.01 M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.3A4 4 0 0 0 17.3 5z'});
document.head.insertAdjacentHTML('beforeend', '<style>' +
  '.gm-menu{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}' +
  '.gm-menu .card{display:flex;flex-direction:column;gap:10px}.gm-menu h2{margin:0;font-size:18px}.gm-menu p{margin:0;color:var(--muted);flex:1}' +
  '.gm-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.gm-col{display:grid;gap:10px;align-content:start}' +
  '.gm-cols .opt{min-height:56px;padding:10px 12px;font-size:15px}' +
  '.opt.gm-sel{border-color:var(--primary);background:var(--surface2);box-shadow:0 0 0 2px var(--primary) inset}' +
  '.opt.gm-done{border-color:var(--good);background:rgba(74,222,128,.12);opacity:.7}.opt.gm-done .icon{color:var(--good)}' +
  '.opt.gm-bad{border-color:var(--bad);background:rgba(251,113,133,.15);animation:gmShake .3s}' +
  '@keyframes gmShake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}' +
  '.gm-type{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.gm-type input{flex:1;min-width:180px;font-family:var(--mono);font-size:18px;padding:12px 14px;border-radius:10px;border:1px solid var(--line);background:var(--term)}' +
  '.gm-score{font-size:clamp(40px,10vw,64px);font-weight:700;color:var(--primary);line-height:1.1}' +
  '.gm-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.gm-sum div{background:var(--surface2);border:1px solid var(--line);border-radius:10px;padding:10px}.gm-sum b{display:block;font-size:20px}.gm-sum span{font-size:12px;color:var(--muted)}' +
  '@media (max-width:760px){.gm-menu{grid-template-columns:1fr}.gm-cols .opt{font-size:14px;padding:8px 10px}}' +
  '</style>');

const GAMES = {
  match: {name: 'Ghép cặp Anh ↔ Việt', min: 4, desc: 'Nối 6 từ tiếng Anh với nghĩa tiếng Việt tương ứng. Mỗi cặp đúng được 10 điểm.'},
  speed: {name: 'Chọn nhanh', min: 4, desc: '10 câu, mỗi câu 10 giây. Chọn đúng càng nhanh, điểm thưởng càng cao (phím 1–4).'},
  type:  {name: 'Gõ từ tiếng Anh', min: 1, desc: 'Xem nghĩa tiếng Việt và gõ từ tiếng Anh. Không phân biệt hoa thường.'}
};
const G = {stage: 'menu', game: '', score: 0, right: 0, wrong: 0, total: 0};
let timer = null, lock = false;

const rnd = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const stop = () => { clearInterval(timer); timer = null; };
function pool() {
  const en = new Set(), vi = new Set(), out = [];
  rnd(H.words()).forEach(w => {
    const a = norm(w.en), b = norm(w.vi);
    if (a && b && !en.has(a) && !vi.has(b)) { en.add(a); vi.add(b); out.push(w); }
  });
  return out;
}
function makeChoice(w, p) {
  const dir = Math.random() < 0.5 ? 'en-vi' : 'vi-en', pick = x => dir === 'en-vi' ? x.vi : x.en;
  const ans = pick(w), seen = new Set([norm(ans)]), wrong = [];
  rnd(p).forEach(x => { const t = pick(x); if (wrong.length < 3 && !seen.has(norm(t))) { seen.add(norm(t)); wrong.push(t); } });
  const opts = rnd([ans].concat(wrong));
  return {w, dir, q: dir === 'en-vi' ? w.en : w.vi, ans, opts, ci: opts.indexOf(ans)};
}

function start(game) {
  const p = pool(), g = GAMES[game];
  if (!g) return;
  if (p.length < g.min) { toast('Cần ít nhất ' + g.min + ' từ khác nhau để chơi trò này.', 'warn'); return; }
  stop(); lock = false;
  Object.assign(G, {stage: 'play', game: game, score: 0, right: 0, wrong: 0, total: 0, i: 0, ans: null, typed: ''});
  if (game === 'match') {
    const items = p.slice(0, 6).map(w => ({id: w.id, en: w.en, vi: w.vi}));
    G.m = {items: items, L: rnd(items), R: rnd(items), done: {}, sl: null, sr: null, bad: null};
    G.total = items.length;
  } else {
    const ws = p.slice(0, ROUND);
    G.total = ws.length;
    G.qs = game === 'speed' ? ws.map(w => makeChoice(w, p)) : ws.map(w => ({w: w}));
    if (game === 'speed') arm();
  }
  paint();
}
function finish() { stop(); G.stage = 'result'; paint(); }
function leave() { stop(); lock = false; G.stage = 'menu'; }

/* ---- Chọn nhanh ---- */
function arm() { stop(); G.t0 = Date.now(); timer = setInterval(tick, 100); }
function tick() {
  const left = T_MAX - (Date.now() - G.t0), bar = $('#gmBar'), sec = $('#gmSec');
  if (bar) bar.style.width = Math.max(0, left / T_MAX * 100) + '%';
  if (sec) sec.textContent = Math.max(0, Math.ceil(left / 1000)) + ' giây';
  if (left <= 0) answerSpeed(-1);
}
function answerSpeed(i) {
  if (G.stage !== 'play' || G.game !== 'speed' || G.ans !== null) return;
  stop();
  const q = G.qs[G.i], ok = i === q.ci;
  G.ans = i;
  if (ok) { G.right++; G.score += 10 + Math.round(10 * Math.max(0, 1 - (Date.now() - G.t0) / T_MAX)); } else G.wrong++;
  paint();
}
function next() {
  if (G.ans === null) return;
  if (G.i + 1 >= G.total) { finish(); return; }
  G.i++; G.ans = null; G.typed = '';
  if (G.game === 'speed') arm();
  paint();
}

/* ---- Gõ từ ---- */
const same = (a, b) => norm(a).replace(/\s+/g, ' ') === norm(b).replace(/\s+/g, ' ');
function answerType(skip) {
  if (G.stage !== 'play' || G.game !== 'type') return;
  if (G.ans !== null) { next(); return; }
  const w = G.qs[G.i].w, ok = !skip && same(G.typed, w.en);
  G.ans = {ok: ok, typed: G.typed};
  if (ok) { G.right++; G.score += 10; } else G.wrong++;
  paint();
}

/* ---- Hiển thị ---- */
const root = H.registerView({id: 'games', title: 'Trò chơi', nav: 'Trò chơi', icon: 'gamepad', after: 'quiz', paint: paint});

function head(sub, btn) {
  return '<div class="page-head"><div><h1>Trò chơi</h1><p class="sub">' + sub + '</p></div>' + (btn ? '<div class="row">' + btn + '</div>' : '') + '</div>';
}
const bar = pct => '<div class="bar" style="margin-bottom:14px" aria-hidden="true"><i style="width:' + pct + '%"></i></div>';
const stat = (a, b) => '<div class="qz-head"><span>' + a + '</span><span>' + b + '</span></div>';
const endBtn = '<div class="row end" style="margin-top:14px"><button class="btn ghost sm" type="button" data-act="gm-menu">Thoát trò chơi</button></div>';

function paintMenu() {
  const n = pool().length;
  return head('Ôn từ vựng bằng các trò chơi ngắn, dùng đúng danh sách từ của bạn (' + n + ' từ).') +
    '<div class="gm-menu">' + Object.keys(GAMES).map(k =>
      '<div class="card"><h2>' + esc(GAMES[k].name) + '</h2><p>' + esc(GAMES[k].desc) + '</p>' +
      '<div><button class="btn primary" type="button" data-act="gm-start" data-game="' + k + '"' + (n < GAMES[k].min ? ' disabled' : '') + '>' + ic('play') + 'Chơi</button></div></div>').join('') + '</div>' +
    (n < 4 ? '<p class="hint" style="margin-top:12px">Cần ít nhất 4 từ khác nhau để mở khóa Ghép cặp và Chọn nhanh. Hãy thêm từ ở mục Từ vựng.</p>' : '');
}
function paintMatch() {
  const m = G.m, col = (list, side) => list.map(x => {
    let cls = 'opt';
    if (m.done[x.id]) cls += ' gm-done'; else if (m['s' + side] === x.id) cls += ' gm-sel';
    if (m.bad && m.bad[side] === x.id) cls += ' gm-bad';
    return '<button type="button" class="' + cls + '" data-act="gm-m" data-side="' + side + '" data-id="' + esc(x.id) + '"' + (m.done[x.id] ? ' disabled' : '') + '><span class="' + (side === 'l' ? 'en' : '') + '">' + esc(side === 'l' ? x.en : x.vi) + '</span>' + (m.done[x.id] ? ic('check') : '') + '</button>';
  }).join('');
  const d = Object.keys(m.done).length;
  return stat('Đã ghép ' + d + ' / ' + G.total, 'Sai ' + G.wrong + ', điểm ' + G.score) + bar(Math.round(d / G.total * 100)) +
    '<p class="hint" style="margin:0">Chọn một từ tiếng Anh (trái) rồi chọn nghĩa tiếng Việt tương ứng (phải).</p>' +
    '<div class="gm-cols"><div class="gm-col">' + col(m.L, 'l') + '</div><div class="gm-col">' + col(m.R, 'r') + '</div></div>' + endBtn;
}
function paintSpeed() {
  const q = G.qs[G.i], a = G.ans !== null, last = G.i + 1 >= G.total;
  const opts = q.opts.map((o, i) => {
    let cls = 'opt', mark = '';
    if (a) { if (i === q.ci) { cls += ' right'; mark = ic('check'); } else if (i === G.ans) { cls += ' wrong'; mark = ic('x'); } else cls += ' dim'; }
    return '<button type="button" class="' + cls + '" data-act="gm-pick" data-i="' + i + '"' + (a ? ' disabled' : '') + '><kbd>' + (i + 1) + '</kbd><span class="' + (q.dir === 'vi-en' ? 'en' : '') + '">' + esc(o) + '</span>' + mark + '</button>';
  }).join('');
  let fb = '';
  if (a) {
    const ok = G.ans === q.ci;
    fb = '<div class="feedback ' + (ok ? 'ok' : 'no') + '" role="status"><b>' + (ok ? 'Chính xác!' : (G.ans < 0 ? 'Hết giờ. ' : 'Chưa đúng. ') + 'Đáp án: ' + esc(q.ans)) + '</b><p>' + esc(q.w.def || '') + '</p>' +
      '<div class="row"><button class="btn primary" type="button" id="gmNext" data-act="gm-next">' + (last ? 'Xem kết quả' : 'Câu tiếp theo') + ic('right') + '</button>' +
      '<button class="btn" type="button" data-act="gm-speak" data-en="' + esc(q.w.en) + '">' + ic('speaker') + 'Phát âm</button></div></div>';
  }
  return stat('Câu ' + (G.i + 1) + ' / ' + G.total, 'Đúng ' + G.right + ', điểm ' + G.score + (a ? '' : ' · <span id="gmSec">10 giây</span>')) +
    (a ? bar(100) : '<div class="bar" style="margin-bottom:14px" aria-hidden="true"><i id="gmBar" style="width:100%;transition:none"></i></div>') +
    '<div class="card qz-q"><span class="chip">' + (q.dir === 'vi-en' ? 'Chọn từ tiếng Anh tương ứng' : 'Chọn nghĩa tiếng Việt tương ứng') + '</span><div class="term-big' + (q.dir === 'en-vi' ? ' en' : '') + '">' + esc(q.q) + '</div></div>' +
    '<div class="opts">' + opts + '</div>' + fb + endBtn;
}
function paintType() {
  const w = G.qs[G.i].w, a = G.ans, last = G.i + 1 >= G.total;
  const hint = w.en.split(/\s+/).map(x => x.length + ' chữ cái').join(' + ');
  let fb = '';
  if (a) fb = '<div class="feedback ' + (a.ok ? 'ok' : 'no') + '" role="status"><b>' + (a.ok ? 'Chính xác!' : 'Chưa đúng. Đáp án: ' + esc(w.en)) + '</b><p>' + esc(w.def || '') + '</p>' +
    '<div class="row"><button class="btn" type="button" data-act="gm-speak" data-en="' + esc(w.en) + '">' + ic('speaker') + 'Phát âm</button></div></div>';
  return stat('Câu ' + (G.i + 1) + ' / ' + G.total, 'Đúng ' + G.right + ', điểm ' + G.score) + bar(Math.round(G.i / G.total * 100)) +
    '<div class="card qz-q"><span class="chip">Gõ từ tiếng Anh tương ứng</span><div class="term-big">' + esc(w.vi) + '</div><span class="tag">' + esc(w.topic) + '</span><p class="hint" style="margin:8px 0 0">Gợi ý: ' + esc(hint) + '</p></div>' +
    '<form class="gm-type" id="gmForm" novalidate><input id="gmIn" type="text" maxlength="120" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Nhập từ tiếng Anh" aria-label="Từ tiếng Anh" value="' + esc(G.typed) + '"' + (a ? ' readonly' : '') + '>' +
    '<button class="btn primary" type="submit" id="gmGo">' + (a ? (last ? 'Xem kết quả' : 'Câu tiếp theo') : 'Kiểm tra') + '</button>' +
    (a ? '' : '<button class="btn" type="button" data-act="gm-skip">Bỏ qua</button>') + '</form>' + fb + endBtn;
}
function paintResult() {
  const n = G.right + G.wrong, acc = n ? Math.round(G.right / n * 100) : 0;
  return '<div class="card center"><span class="chip">' + esc(GAMES[G.game].name) + '</span><div class="gm-score">' + G.score + '</div><p class="muted" style="margin:0">điểm</p>' +
    '<div class="gm-sum"><div><b>' + G.right + '</b><span>Đúng</span></div><div><b>' + G.wrong + '</b><span>Sai</span></div><div><b>' + acc + '%</b><span>Chính xác</span></div></div>' +
    '<div class="row" style="justify-content:center"><button class="btn primary" type="button" data-act="gm-start" data-game="' + G.game + '">' + ic('flip') + 'Chơi lại</button>' +
    '<button class="btn" type="button" data-act="gm-menu">Chọn trò khác</button></div></div>';
}
function paint() {
  let h;
  if (G.stage === 'result') h = head(esc(GAMES[G.game].name)) + paintResult();
  else if (G.stage === 'play') h = head(esc(GAMES[G.game].name)) + (G.game === 'match' ? paintMatch() : G.game === 'speed' ? paintSpeed() : paintType());
  else h = paintMenu();
  root.innerHTML = h;
  if (G.stage === 'play' && G.game === 'speed' && G.ans !== null) { const b = $('#gmNext'); if (b) b.focus(); }
  if (G.stage === 'play' && G.game === 'type') { const i = $('#gmIn'); if (i && G.ans === null) { i.focus(); const l = i.value.length; try { i.setSelectionRange(l, l); } catch (e) {} } else { const b = $('#gmGo'); if (b) b.focus(); } }
}

/* ---- Sự kiện ---- */
Object.assign(ACT, {
  'gm-start': el => start(el.dataset.game),
  'gm-menu': () => { leave(); paint(); },
  'gm-next': next,
  'gm-pick': el => answerSpeed(parseInt(el.dataset.i, 10)),
  'gm-skip': () => answerType(true),
  'gm-speak': el => H.speak(el.dataset.en),
  'gm-m': el => {
    const m = G.m;
    if (G.stage !== 'play' || G.game !== 'match' || lock) return;
    const s = el.dataset.side, id = el.dataset.id, k = 's' + s;
    if (m.done[id]) return;
    m[k] = m[k] === id ? null : id;
    if (m.sl && m.sr) {
      if (m.sl === m.sr) {
        m.done[m.sl] = 1; G.right++; G.score += 10; m.sl = m.sr = null;
        if (Object.keys(m.done).length >= G.total) { finish(); return; }
      } else {
        G.wrong++; m.bad = {l: m.sl, r: m.sr}; m.sl = m.sr = null; lock = true;
        setTimeout(() => { lock = false; if (G.m === m) { m.bad = null; if (G.stage === 'play' && H.route().name === 'games') paint(); } }, 600);
      }
    }
    paint();
  }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'gmForm') return;
  e.preventDefault();
  if (G.ans === null && !G.typed.trim()) { toast('Hãy nhập từ tiếng Anh trước.', 'warn'); return; }
  answerType(false);
});
document.addEventListener('input', e => { if (e.target.id === 'gmIn' && G.ans === null) G.typed = e.target.value; });
document.addEventListener('keydown', e => {
  if (H.route().name !== 'games' || G.stage !== 'play' || G.game !== 'speed' || G.ans !== null) return;
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (/^[1-4]$/.test(e.key) && +e.key <= G.qs[G.i].opts.length) { e.preventDefault(); answerSpeed(+e.key - 1); }
});
window.addEventListener('hashchange', () => { if (H.route().name !== 'games' && G.stage !== 'menu') leave(); });
});
