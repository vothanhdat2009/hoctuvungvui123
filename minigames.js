/* minigames.js — Trò chơi ôn từ vựng: Ghép cặp, Lật thẻ bài, Chọn nhanh, Gõ từ.
   Phải nạp sau hoctuvung.html phần lõi (qua window.HTS_MODULES). Dùng trực tiếp danh sách từ hiện có (H.words()), không ghi thêm dữ liệu.
   Bản nâng cấp: hiệu ứng (fade/shake/lật thẻ/confetti), âm thanh tổng hợp bằng WebAudio (không cần file mp3),
   đếm ngược thời gian, combo x1→x3, chế độ Lật thẻ bài, nút Thách đấu + sự kiện 'hts:game-finished' cho Bảng xếp hạng Supabase. */
(window.HTS_MODULES = window.HTS_MODULES || []).push(function (H) {
'use strict';
if (!H.words) return;
const {$, esc, ic, toast, norm, ACT} = H;
const ROUND = 10, T_MAX = 10000, PAIRS = 6;

H.addIcons({play: 'M6 3l14 9-14 9z', gamepad: 'M6 12h4 M8 10v4 M15 13h.01 M18 11h.01 M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.3A4 4 0 0 0 17.3 5z'});
document.head.insertAdjacentHTML('beforeend', '<style>' +
  '.gm-menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}' +
  '.gm-menu .card{display:flex;flex-direction:column;gap:10px}.gm-menu h2{margin:0;font-size:18px}.gm-menu p{margin:0;color:var(--muted);flex:1}' +
  '.gm-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.gm-col{display:grid;gap:10px;align-content:start}' +
  '.gm-cols .opt{min-height:56px;padding:10px 12px;font-size:15px}' +
  '.opt.gm-sel{border-color:var(--primary);background:var(--surface2);box-shadow:0 0 0 2px var(--primary) inset}' +
  /* đúng: thu nhỏ + mờ dần rồi ẩn (vẫn giữ chỗ để bố cục không nhảy) */
  '.opt.gm-out{border-color:var(--good);background:rgba(74,222,128,.18);pointer-events:none;animation:gmOut .5s ease-in forwards}' +
  '.opt.gm-gone{opacity:0;visibility:hidden;pointer-events:none}' +
  '@keyframes gmOut{40%{transform:scale(1.06);opacity:1}100%{transform:scale(.5);opacity:0;visibility:hidden}}' +
  /* sai: viền đỏ + rung */
  '.opt.gm-bad,.opts .opt.wrong{border-color:var(--bad)!important;background:rgba(251,113,133,.18)!important;box-shadow:0 0 0 2px var(--bad) inset;animation:gmShake .4s}' +
  '@keyframes gmShake{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}' +
  '.opts .opt.right{animation:gmPulse .4s}@keyframes gmPulse{50%{transform:scale(1.04)}}' +
  /* lật thẻ */
  '.gm-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}' +
  '.gm-card{min-height:76px;justify-content:center;text-align:center;font-size:15px;padding:8px}.gm-q{font-size:26px;color:var(--muted);font-weight:700}' +
  '.gm-card.gm-up{border-color:var(--primary);background:var(--surface2);animation:gmFlip .3s}' +
  '@keyframes gmFlip{from{transform:rotateY(90deg)}to{transform:none}}' +
  '.gm-type{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.gm-type input{flex:1;min-width:180px;font-family:var(--mono);font-size:18px;padding:12px 14px;border-radius:10px;border:1px solid var(--line);background:var(--term)}' +
  '.gm-combo{color:var(--primary);font-weight:700}' +
  '.gm-score{font-size:clamp(40px,10vw,64px);font-weight:700;color:var(--primary);line-height:1.1}' +
  '.gm-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.gm-sum div{background:var(--surface2);border:1px solid var(--line);border-radius:10px;padding:10px}.gm-sum b{display:block;font-size:20px}.gm-sum span{font-size:12px;color:var(--muted)}' +
  '.gm-confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}.gm-confetti i{position:absolute;top:-14px;width:8px;height:14px;border-radius:2px;animation:gmFall linear forwards}' +
  '@keyframes gmFall{to{transform:translateY(105vh) rotate(540deg)}}' +
  '@media (max-width:760px){.gm-cols .opt{font-size:14px;padding:8px 10px}.gm-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
  '@media (prefers-reduced-motion:reduce){.gm-confetti{display:none}.opt.gm-out,.opt.gm-bad,.opts .opt.wrong,.opts .opt.right,.gm-card.gm-up{animation:none}}' +
  '</style>');

const GAMES = {
  match:  {name: 'Ghép cặp Anh ↔ Việt', min: 4, desc: 'Nối 6 từ tiếng Anh với nghĩa tiếng Việt trong 60 giây. Ghép đúng liên tiếp để nhân điểm: +10, +20, +30.'},
  memory: {name: 'Lật thẻ bài', min: 4, desc: '12 thẻ úp: lật từng thẻ để tìm cặp từ – nghĩa trong 90 giây. Nhớ vị trí và nối combo để lấy điểm cao.'},
  speed:  {name: 'Chọn nhanh', min: 4, desc: '10 câu, mỗi câu 10 giây. Chọn đúng càng nhanh, điểm thưởng càng cao (phím 1–4).'},
  type:   {name: 'Gõ từ tiếng Anh', min: 1, desc: 'Xem nghĩa tiếng Việt và gõ từ tiếng Anh. Không phân biệt hoa thường.'}
};
const LIMITS = {match: 60000, memory: 90000};
const G = {stage: 'menu', game: '', score: 0, right: 0, wrong: 0, total: 0, combo: 0, limit: 0, bonus: 0, timeout: false};
let timer = null, lock = false, muted = false, AC = null;
try { muted = localStorage.getItem('gm-mute') === '1'; } catch (e) {}

/* ---- Âm thanh (WebAudio, không cần file) ---- */
function tone(f, t, d, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
}
function clap(t, d) {
  const len = Math.floor(AC.sampleRate * d), buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = 1500; g.gain.value = 0.18;
  s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t);
}
function sfx(k) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const n = AC.currentTime;
    if (k === 'click') tone(660, n, 0.06, 'triangle', 0.08);
    else if (k === 'good') { tone(880, n, 0.12, 'sine', 0.16); tone(1320, n + 0.09, 0.22, 'sine', 0.16); }
    else if (k === 'bad') { tone(150, n, 0.25, 'sawtooth', 0.1); tone(105, n + 0.08, 0.25, 'square', 0.07); }
    else if (k === 'win') {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, n + i * 0.09, 0.3, 'triangle', 0.14));
      for (let i = 0; i < 6; i++) clap(n + 0.45 + i * 0.11 + Math.random() * 0.05, 0.08);
    }
  } catch (e) {}
}

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
/* điểm combo: đúng liên tiếp 1→+10, 2→+20, 3 trở lên→+30 */
function hit() { G.combo++; const pts = 10 * Math.min(3, G.combo); G.score += pts; G.right++; sfx('good'); return pts; }
function miss() { G.combo = 0; G.wrong++; sfx('bad'); }

function start(game) {
  const p = pool(), g = GAMES[game];
  if (!g) return;
  if (p.length < g.min) { toast('Cần ít nhất ' + g.min + ' từ khác nhau để chơi trò này.', 'warn'); return; }
  stop(); lock = false;
  Object.assign(G, {stage: 'play', game: game, score: 0, right: 0, wrong: 0, total: 0, combo: 0, bonus: 0, timeout: false, limit: LIMITS[game] || 0, i: 0, ans: null, typed: '', startAt: Date.now()});
  if (game === 'match' || game === 'memory') {
    const items = p.slice(0, PAIRS).map(w => ({id: w.id, en: w.en, vi: w.vi}));
    G.total = items.length;
    if (game === 'match') G.m = {items: items, L: rnd(items), R: rnd(items), done: {}, sl: null, sr: null, bad: null, fresh: null};
    else {
      const cards = [];
      items.forEach(x => { cards.push({id: x.id, txt: x.en, side: 'en'}); cards.push({id: x.id, txt: x.vi, side: 'vi'}); });
      G.mem = {cards: rnd(cards), open: [], done: {}, bad: null, fresh: null};
    }
    arm();
  } else {
    const ws = p.slice(0, ROUND);
    G.total = ws.length;
    G.qs = game === 'speed' ? ws.map(w => makeChoice(w, p)) : ws.map(w => ({w: w}));
    if (game === 'speed') arm();
  }
  paint();
}
function finish() {
  stop();
  const timed = G.game === 'match' || G.game === 'memory';
  const left = timed ? Math.max(0, G.limit - (Date.now() - G.t0)) : 0;
  G.bonus = timed && !G.timeout ? Math.floor(left / 1000) : 0; /* thưởng 1 điểm cho mỗi giây còn lại */
  G.score += G.bonus;
  G.stage = 'result';
  sfx(G.timeout ? 'bad' : 'win');
  const n = G.right + G.wrong;
  try {
    window.dispatchEvent(new CustomEvent('hts:game-finished', {detail: {
      game: G.game, score: G.score, right: G.right, wrong: G.wrong, total: G.total,
      accuracy: n ? Math.round(G.right / n * 100) : 0, timeout: G.timeout, durationMs: Date.now() - G.startAt
    }}));
  } catch (e) {}
  paint();
}
function leave() { stop(); lock = false; G.stage = 'menu'; }

/* ---- Đồng hồ ---- */
function arm() { stop(); G.t0 = Date.now(); timer = setInterval(G.game === 'speed' ? tick : tickGame, 100); }
function tickGame() {
  if (G.stage !== 'play' || (G.game !== 'match' && G.game !== 'memory')) { stop(); return; }
  const left = G.limit - (Date.now() - G.t0), bar = $('#gmBar'), sec = $('#gmSec');
  if (bar) { bar.style.width = Math.max(0, left / G.limit * 100) + '%'; bar.style.background = left < 10000 ? 'var(--bad)' : ''; }
  if (sec) sec.textContent = Math.max(0, Math.ceil(left / 1000)) + ' giây';
  if (left <= 0) { G.timeout = true; finish(); }
}

/* ---- Chọn nhanh ---- */
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
  if (ok) { hit(); G.score += Math.round(10 * Math.max(0, 1 - (Date.now() - G.t0) / T_MAX)); } else miss();
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
  if (ok) hit(); else miss();
  paint();
}

/* ---- Hiển thị ---- */
const root = H.registerView({id: 'games', title: 'Trò chơi', nav: 'Trò chơi', icon: 'gamepad', after: 'quiz', paint: paint});

const soundBtn = () => '<button class="btn ghost sm" type="button" data-act="gm-mute" aria-pressed="' + (!muted) + '">' + ic('speaker') + (muted ? 'Bật âm thanh' : 'Tắt âm thanh') + '</button>';
function head(sub) {
  return '<div class="page-head"><div><h1>Trò chơi</h1><p class="sub">' + sub + '</p></div><div class="row">' + soundBtn() + '</div></div>';
}
const bar = pct => '<div class="bar" style="margin-bottom:14px" aria-hidden="true"><i style="width:' + pct + '%"></i></div>';
const stat = (a, b) => '<div class="qz-head"><span>' + a + '</span><span>' + b + '</span></div>';
const endBtn = '<div class="row end" style="margin-top:14px"><button class="btn ghost sm" type="button" data-act="gm-menu">Thoát trò chơi</button></div>';
const comboTxt = () => G.combo >= 2 ? ' · <span class="gm-combo">Combo ×' + Math.min(3, G.combo) + '</span>' : '';
const timeBar = () => {
  const left = Math.max(0, G.limit - (Date.now() - G.t0));
  return '<div class="bar" style="margin-bottom:14px" aria-hidden="true"><i id="gmBar" style="width:' + (left / G.limit * 100) + '%;transition:none' + (left < 10000 ? ';background:var(--bad)' : '') + '"></i></div>';
};
const secTxt = () => '<span id="gmSec">' + Math.max(0, Math.ceil((G.limit - (Date.now() - G.t0)) / 1000)) + ' giây</span>';

function paintMenu() {
  const n = pool().length;
  return head('Ôn từ vựng bằng các trò chơi ngắn, dùng đúng danh sách từ của bạn (' + n + ' từ).') +
    '<div class="gm-menu">' + Object.keys(GAMES).map(k =>
      '<div class="card"><h2>' + esc(GAMES[k].name) + '</h2><p>' + esc(GAMES[k].desc) + '</p>' +
      '<div><button class="btn primary" type="button" data-act="gm-start" data-game="' + k + '"' + (n < GAMES[k].min ? ' disabled' : '') + '>' + ic('play') + 'Chơi</button></div></div>').join('') + '</div>' +
    (n < 4 ? '<p class="hint" style="margin-top:12px">Cần ít nhất 4 từ khác nhau để mở khóa Ghép cặp, Lật thẻ bài và Chọn nhanh. Hãy thêm từ ở mục Từ vựng.</p>' : '');
}
function paintMatch() {
  const m = G.m, col = (list, side) => list.map(x => {
    let cls = 'opt';
    if (m.done[x.id]) cls += m.fresh === x.id ? ' gm-out' : ' gm-gone'; else if (m['s' + side] === x.id) cls += ' gm-sel';
    if (m.bad && m.bad[side] === x.id) cls += ' gm-bad';
    return '<button type="button" class="' + cls + '" data-act="gm-m" data-side="' + side + '" data-id="' + esc(x.id) + '"' + (m.done[x.id] ? ' disabled' : '') + '><span class="' + (side === 'l' ? 'en' : '') + '">' + esc(side === 'l' ? x.en : x.vi) + '</span></button>';
  }).join('');
  const d = Object.keys(m.done).length;
  return stat('Đã ghép ' + d + ' / ' + G.total + ' · ' + secTxt(), 'Sai ' + G.wrong + ', điểm ' + G.score + comboTxt()) + timeBar() +
    '<p class="hint" style="margin:0">Chọn một từ tiếng Anh (trái) rồi chọn nghĩa tiếng Việt tương ứng (phải).</p>' +
    '<div class="gm-cols"><div class="gm-col">' + col(m.L, 'l') + '</div><div class="gm-col">' + col(m.R, 'r') + '</div></div>' + endBtn;
}
function paintMemory() {
  const M = G.mem, d = Object.keys(M.done).length;
  const cards = M.cards.map((c, k) => {
    const gone = M.done[c.id], up = M.open.indexOf(k) >= 0;
    let cls = 'opt gm-card';
    if (gone) cls += M.fresh === c.id ? ' gm-out' : ' gm-gone';
    else if (up) cls += ' gm-up' + (M.bad && M.bad.indexOf(k) >= 0 ? ' gm-bad' : '');
    return '<button type="button" class="' + cls + '" data-act="gm-c" data-k="' + k + '"' + (gone || up ? ' disabled' : '') + ' aria-label="' + (up || gone ? esc(c.txt) : 'Thẻ úp') + '">' +
      (up || gone ? '<span class="' + (c.side === 'en' ? 'en' : '') + '">' + esc(c.txt) + '</span>' : '<span class="gm-q">?</span>') + '</button>';
  }).join('');
  return stat('Đã tìm ' + d + ' / ' + G.total + ' cặp · ' + secTxt(), 'Lật sai ' + G.wrong + ', điểm ' + G.score + comboTxt()) + timeBar() +
    '<p class="hint" style="margin:0">Lật hai thẻ mỗi lượt: một từ tiếng Anh và nghĩa tiếng Việt tương ứng.</p><div class="gm-grid">' + cards + '</div>' + endBtn;
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
  return stat('Câu ' + (G.i + 1) + ' / ' + G.total, 'Đúng ' + G.right + ', điểm ' + G.score + comboTxt() + (a ? '' : ' · <span id="gmSec">10 giây</span>')) +
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
  return stat('Câu ' + (G.i + 1) + ' / ' + G.total, 'Đúng ' + G.right + ', điểm ' + G.score + comboTxt()) + bar(Math.round(G.i / G.total * 100)) +
    '<div class="card qz-q"><span class="chip">Gõ từ tiếng Anh tương ứng</span><div class="term-big">' + esc(w.vi) + '</div><span class="tag">' + esc(w.topic) + '</span><p class="hint" style="margin:8px 0 0">Gợi ý: ' + esc(hint) + '</p></div>' +
    '<form class="gm-type" id="gmForm" novalidate><input id="gmIn" type="text" maxlength="120" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Nhập từ tiếng Anh" aria-label="Từ tiếng Anh" value="' + esc(G.typed) + '"' + (a ? ' readonly' : '') + '>' +
    '<button class="btn primary" type="submit" id="gmGo">' + (a ? (last ? 'Xem kết quả' : 'Câu tiếp theo') : 'Kiểm tra') + '</button>' +
    (a ? '' : '<button class="btn" type="button" data-act="gm-skip">Bỏ qua</button>') + '</form>' + fb + endBtn;
}
function confetti() {
  const cols = ['#4ade80', '#fbbf24', '#60a5fa', '#fb7185', '#c084fc'];
  let s = '';
  for (let i = 0; i < 28; i++) s += '<i style="left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % 5] + ';animation-delay:' + (Math.random() * 0.8).toFixed(2) + 's;animation-duration:' + (1.6 + Math.random() * 1.2).toFixed(2) + 's"></i>';
  return '<div class="gm-confetti" aria-hidden="true">' + s + '</div>';
}
function paintResult() {
  const n = G.right + G.wrong, acc = n ? Math.round(G.right / n * 100) : 0;
  return (G.timeout ? '' : confetti()) +
    '<div class="card center"><span class="chip">' + esc(GAMES[G.game].name) + '</span><div class="gm-score">' + G.score + '</div><p class="muted" style="margin:0">điểm</p>' +
    (G.timeout ? '<p class="hint" style="margin:8px 0 0">Hết giờ! Hãy thử lại để ghép hết các cặp.</p>' : '') +
    (G.bonus ? '<p class="hint" style="margin:8px 0 0">Gồm ' + G.bonus + ' điểm thưởng thời gian.</p>' : '') +
    '<div class="gm-sum"><div><b>' + G.right + '</b><span>Đúng</span></div><div><b>' + G.wrong + '</b><span>Sai</span></div><div><b>' + acc + '%</b><span>Chính xác</span></div></div>' +
    '<div class="row" style="justify-content:center"><button class="btn primary" type="button" data-act="gm-start" data-game="' + G.game + '">' + ic('flip') + 'Làm lại</button>' +
    '<button class="btn" type="button" data-act="gm-challenge">Thách đấu</button>' +
    '<button class="btn" type="button" data-act="gm-menu">Chọn trò khác</button></div></div>';
}
function paint() {
  let h;
  if (G.stage === 'result') h = head(esc(GAMES[G.game].name)) + paintResult();
  else if (G.stage === 'play') h = head(esc(GAMES[G.game].name)) + (G.game === 'match' ? paintMatch() : G.game === 'memory' ? paintMemory() : G.game === 'speed' ? paintSpeed() : paintType());
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
  'gm-mute': () => { muted = !muted; try { localStorage.setItem('gm-mute', muted ? '1' : '0'); } catch (e) {} sfx('click'); paint(); },
  'gm-challenge': () => {
    const txt = 'Mình vừa đạt ' + G.score + ' điểm ở trò "' + GAMES[G.game].name + '" trên Học từ vựng. Bạn có vượt qua được không? ' + location.href.split('#')[0] + '#games';
    try { window.dispatchEvent(new CustomEvent('hts:game-challenge', {detail: {game: G.game, score: G.score, text: txt}})); } catch (e) {}
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Đã sao chép lời thách đấu. Hãy gửi cho bạn bè!'), () => toast(txt));
    else toast(txt);
  },
  'gm-m': el => {
    const m = G.m;
    if (G.stage !== 'play' || G.game !== 'match' || lock) return;
    const s = el.dataset.side, id = el.dataset.id, k = 's' + s;
    if (m.done[id]) return;
    m.fresh = null;
    m[k] = m[k] === id ? null : id;
    if (m[k]) sfx('click');
    if (m.sl && m.sr) {
      if (m.sl === m.sr) {
        m.done[m.sl] = 1; m.fresh = m.sl; hit(); m.sl = m.sr = null;
        if (Object.keys(m.done).length >= G.total) { finish(); return; }
      } else {
        miss(); m.bad = {l: m.sl, r: m.sr}; m.sl = m.sr = null; lock = true;
        setTimeout(() => { lock = false; if (G.m === m) { m.bad = null; if (G.stage === 'play' && H.route().name === 'games') paint(); } }, 600);
      }
    }
    paint();
  },
  'gm-c': el => {
    const M = G.mem;
    if (G.stage !== 'play' || G.game !== 'memory' || lock) return;
    const k = parseInt(el.dataset.k, 10), c = M.cards[k];
    if (!c || M.done[c.id] || M.open.indexOf(k) >= 0) return;
    M.fresh = null;
    sfx('click');
    M.open.push(k);
    if (M.open.length === 2) {
      const a = M.cards[M.open[0]], b = M.cards[M.open[1]];
      if (a.id === b.id) {
        M.done[a.id] = 1; M.fresh = a.id; M.open = []; hit();
        if (Object.keys(M.done).length >= G.total) { finish(); return; }
      } else {
        miss(); M.bad = M.open.slice(); lock = true;
        setTimeout(() => { lock = false; if (G.mem === M) { M.open = []; M.bad = null; if (G.stage === 'play' && H.route().name === 'games') paint(); } }, 900);
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
