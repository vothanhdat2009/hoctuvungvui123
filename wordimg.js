/* wordimg.js — Ảnh minh họa cho flashcard (mỗi từ 1 ảnh).
   Nạp sau lõi qua window.HTS_MODULES. Ảnh lưu ở word.img (data URL JPEG nhỏ) cùng dữ liệu từ vựng,
   nên dùng đúng hệ thống lưu hiện có (localStorage khi chưa đăng nhập, user_data khi đã đăng nhập). */
(window.HTS_MODULES = window.HTS_MODULES || []).push(function (H) {
'use strict';
if (!H.words || !H.onFlash) return;
const {$, ic, toast, ACT} = H;

const MAX_SIDE = 560;          // cạnh dài tối đa (px)
const MIN_SIDE = 300;          // không thu nhỏ quá mức này khi ép dung lượng
const MAX_LEN = 45000;         // ~34 KB nhị phân mỗi ảnh (chuỗi base64)
const TOTAL_MAX = 2500000;     // tổng ký tự ảnh toàn bộ từ, giữ dưới hạn ~5 MB của localStorage

H.addIcons({image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 8.5h.01 M21 15l-5-5L5 21'});
document.head.insertAdjacentHTML('beforeend', '<style>' +
  '.card3d.has-img .face{overflow:hidden;color:#fff}' +
  '.card3d.has-img .face::before{content:"";position:absolute;inset:0;z-index:0;border-radius:inherit;background-image:linear-gradient(rgba(0,0,0,.52),rgba(0,0,0,.66)),var(--fcimg);background-size:cover;background-position:center}' +
  '.card3d.has-img .face.back::before{background-image:linear-gradient(rgba(0,0,0,.68),rgba(0,0,0,.78)),var(--fcimg)}' +
  '.card3d.has-img .face>*{position:relative;z-index:1}' +
  '.card3d.has-img .term-big,.card3d.has-img .def{color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7)}' +
  '.card3d.has-img .term-big.en{color:#a7f3d0}' +
  '.card3d.has-img .hint{color:rgba(255,255,255,.85)}' +
  '.card3d.has-img .tag,.card3d.has-img .chip{background:rgba(0,0,0,.45);color:#fff;border-color:rgba(255,255,255,.35)}' +
  '.fc-img-row{margin-top:10px}' +
  '</style>');

// ----- Chọn tệp, resize và nén -----
const inp = document.createElement('input');
inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true; inp.id = 'wiFile';
document.body.appendChild(inp);
let pendingId = null;

function toJpeg(file) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error('type'));
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const W = img.naturalWidth, Hh = img.naturalHeight;
      if (!W || !Hh) return rej(new Error('size'));
      let scale = Math.min(1, MAX_SIDE / Math.max(W, Hh));
      for (;;) {
        const w = Math.max(1, Math.round(W * scale)), h = Math.max(1, Math.round(Hh * scale));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);   // PNG trong suốt -> nền trắng
        x.imageSmoothingQuality = 'high';
        x.drawImage(img, 0, 0, w, h);
        let q = 0.78, out = c.toDataURL('image/jpeg', q);
        while (out.length > MAX_LEN && q > 0.4) { q -= 0.08; out = c.toDataURL('image/jpeg', q); }
        if (out.length <= MAX_LEN) return res(out);
        if (Math.max(w, h) <= MIN_SIDE) return rej(new Error('big'));
        scale *= 0.85;
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('load')); };
    img.src = url;
  });
}

const dbWord = id => H.words().find(w => w.id === id) || null;
const totalLen = skipId => H.words().reduce((n, w) => n + (w.id !== skipId && w.img ? w.img.length : 0), 0);

function setImg(id, data) {
  if (H.acctLoading()) { toast('Đang tải dữ liệu tài khoản, hãy thử lại sau giây lát.', 'warn'); return false; }
  const w = dbWord(id); if (!w) return false;
  if (data) {
    if (totalLen(id) + data.length > TOTAL_MAX) {
      toast('Đã có quá nhiều ảnh (bộ nhớ trình duyệt có hạn). Hãy xóa bớt ảnh ở từ khác rồi thử lại.', 'warn');
      return false;
    }
    w.img = data;
  } else delete w.img;
  H.save();
  H.repaintFlash();
  return true;
}

inp.addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; e.target.value = '';
  const id = pendingId; pendingId = null;
  if (!f || !id) return;
  try {
    const data = await toJpeg(f);
    if (setImg(id, data)) toast('Đã cập nhật ảnh cho thẻ.');
  } catch (x) {
    toast('Không dùng được ảnh này. Hãy chọn tệp ảnh JPG, PNG hoặc WebP khác.', 'warn');
  }
});

// ----- Giao diện trên thẻ -----
H.onFlash(function (w, stage) {
  const card = $('#fcCard');
  const real = dbWord(w.id);                // thẻ trong bộ thẻ riêng (không thuộc danh sách từ) thì không gán ảnh
  if (!card || !real) return;
  if (real.img) {
    card.classList.add('has-img');
    card.style.setProperty('--fcimg', 'url("' + real.img + '")');
  }
  const row = document.createElement('div');
  row.className = 'fc-actions fc-img-row';
  row.innerHTML =
    '<button class="btn sm" type="button" data-act="fc-img-pick" data-id="' + real.id + '">' + ic('image') + (real.img ? 'Đổi ảnh' : 'Thêm ảnh') + '</button>' +
    (real.img ? '<button class="btn sm danger" type="button" data-act="fc-img-del" data-id="' + real.id + '">' + ic('trash') + 'Xóa ảnh</button>' : '');
  const actions = stage.querySelectorAll('.fc-actions');
  const last = actions[actions.length - 1];
  if (last) last.after(row); else stage.appendChild(row);
});

Object.assign(ACT, {
  'fc-img-pick': el => { pendingId = el.dataset.id; inp.click(); },
  'fc-img-del': el => { if (setImg(el.dataset.id, '')) toast('Đã xóa ảnh của thẻ.'); }
});
});
