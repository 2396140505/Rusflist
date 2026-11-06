// 画布适配（逻辑宽 390，高度随屏幕 640~900，宽屏时居中竖屏列）、触摸输入、小工具
export const V = { W: 390, H: 780, k: 1, dpr: 1, ox: 0, oy: 0, safeTop: 0 };
export const cvs = document.createElement('canvas');
export const ctx = cvs.getContext('2d');
document.body.appendChild(cvs);
const probe = document.createElement('div');
probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
document.body.appendChild(probe);
const resizeCbs = [];
export const onResize = f => resizeCbs.push(f);
function resize() {
  const w = innerWidth, h = innerHeight;
  V.dpr = Math.min(devicePixelRatio || 1, 2.5);
  V.k = Math.min(w / 390, h / 640);
  V.H = Math.min(900, h / V.k);
  V.ox = (w - 390 * V.k) / 2; V.oy = (h - V.H * V.k) / 2;
  cvs.width = Math.round(w * V.dpr); cvs.height = Math.round(h * V.dpr);
  cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
  V.safeTop = Math.max(0, (probe.offsetHeight - V.oy) / V.k);
  resizeCbs.forEach(f => f());
}
addEventListener('resize', resize); resize();
// 开始一帧：清屏（含黑边），设好逻辑坐标变换
export function frameBegin(bg) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.setTransform(V.dpr * V.k, 0, 0, V.dpr * V.k, V.ox * V.dpr, V.oy * V.dpr);
}
// 离屏画布（逻辑尺寸 w×h，按当前分辨率放大）
export function off(w, h) {
  const c = document.createElement('canvas'), s = V.dpr * V.k;
  c.width = Math.ceil(w * s); c.height = Math.ceil(h * s);
  const x = c.getContext('2d'); x.scale(s, s); c.lw = w; c.lh = h; return [c, x];
}

// 输入：touchstart/move/end 为主（单指），鼠标仅作桌面兜底；回调收到逻辑坐标
export const input = { down: null, move: null, up: null, touched: false, first: [] };
const toL = (cx, cy) => [(cx - V.ox) / V.k, (cy - V.oy) / V.k];
let tid = null, sawTouch = false;
const firstTouch = () => { if (!input.touched) { input.touched = true; input.first.forEach(f => f()); } };
document.addEventListener('touchstart', e => {
  if (e.target.closest && e.target.closest('[data-ui]')) return;
  e.preventDefault(); sawTouch = true; firstTouch();
  const t = e.changedTouches[0]; if (tid !== null) return; tid = t.identifier;
  input.down && input.down(...toL(t.clientX, t.clientY));
}, { passive: false });
document.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === tid) input.move && input.move(...toL(t.clientX, t.clientY));
}, { passive: false });
const tend = e => {
  for (const t of e.changedTouches) if (t.identifier === tid) { tid = null; input.up && input.up(...toL(t.clientX, t.clientY)); }
};
document.addEventListener('touchend', tend, { passive: false });
document.addEventListener('touchcancel', tend, { passive: false });
let mdown = false;
cvs.addEventListener('mousedown', e => { if (sawTouch) return; mdown = true; firstTouch(); input.down && input.down(...toL(e.clientX, e.clientY)); });
addEventListener('mousemove', e => { if (sawTouch || !mdown) return; input.move && input.move(...toL(e.clientX, e.clientY)); });
addEventListener('mouseup', e => { if (sawTouch || !mdown) return; mdown = false; input.up && input.up(...toL(e.clientX, e.clientY)); });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

// 小工具
let seed = 1;
export const srand = s => { seed = s >>> 0 || 1; };
export const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const R = (a, b) => a + Math.random() * (b - a);
export const RS = (a, b) => a + rnd() * (b - a);
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = a => a[Math.floor(Math.random() * a.length)];
export function txt(x, s, px, py, o = {}) {
  x.save();
  x.font = (o.w || 'normal') + ' ' + (o.size || 16) + 'px ' + (o.font || 'sans-serif') + ', sans-serif';
  x.textAlign = o.align || 'left'; x.textBaseline = o.base || 'middle';
  if (o.alpha !== undefined) x.globalAlpha = o.alpha;
  if (o.rot) { x.translate(px, py); x.rotate(o.rot); px = 0; py = 0; }
  const mw = o.max || 380;
  if (o.stroke) { x.lineWidth = o.sw || 4; x.strokeStyle = o.stroke; x.lineJoin = 'round'; x.strokeText(s, px, py, mw); }
  if (o.shadow) { x.shadowColor = o.shadow; x.shadowBlur = o.blur || 8; }
  x.fillStyle = o.color || '#fff'; x.fillText(s, px, py, mw);
  x.restore();
}
// 中文按字折行，最多 lines 行，第一行中线在 py
export function wrap(x, s, px, py, w, lh, o = {}, lines = 3) {
  x.save(); x.font = (o.w || 'normal') + ' ' + (o.size || 16) + 'px ' + (o.font || 'sans-serif');
  const out = []; let cur = '';
  for (const ch of s) { if (cur && x.measureText(cur + ch).width > w) { out.push(cur); cur = ch; } else cur += ch; }
  if (cur) out.push(cur); x.restore();
  out.slice(0, lines).forEach((l, i) => txt(x, l, px, py + i * lh, { ...o, max: w }));
}
export function rr(x, px, py, w, h, r) { x.beginPath(); x.roundRect ? x.roundRect(px, py, w, h, r) : x.rect(px, py, w, h); }
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
};
// 震动（支持的设备）
export const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };
