// C 卡通上班：早高峰电梯 —— 俯视电梯轿厢网格。大堂排队的同事各有"占地形状"和"脾气"：
// 抱纸箱的占 2 格、推自行车的占 L 形、端咖啡的不能被挤（四周要空）、吵过架的两人不能相邻、老板周围一圈没人敢站。
// 拖人进轿厢摆好 → 关门送一趟。时钟走到 9:00 前送上楼的人越多越好。挑战：限时最大积累（准点打卡人数）。
import { txt, rr } from './core.js';
const W = 390, H = 780;
// 种子随机：缓存出的背景每次都一样
let _s = 1;
export const aseed = s => { _s = (s >>> 0) || 1; };
const rnd = () => { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; };
const R = (a, b) => a + rnd() * (b - a);

const KF = 'Kuaile,sans-serif', LF = 'Lilita,sans-serif';
const INK = '#2a2440';
const CELL = 54, GY = 252; // 轿厢网格上沿
const SKIN = ['#ffd9b8', '#f2c08e', '#c98a5a', '#8a5a3a'];

// ———————————————— 大堂背景 ————————————————
// 窗外城市：远楼浅、近楼深，亮窗格
function city(x, x0, y0, x1, y1, o) {
  x.save(); x.beginPath(); x.rect(x0, y0, x1 - x0, y1 - y0); x.clip();
  const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, o.sky[0]); g.addColorStop(1, o.sky[1]); x.fillStyle = g; x.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (o.sun) { const sg = x.createRadialGradient(o.sun[0], o.sun[1], 2, o.sun[0], o.sun[1], 40); sg.addColorStop(0, o.sun[2]); sg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = sg; x.fillRect(x0, y0, x1 - x0, y1 - y0); }
  // 云
  x.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 4; i++) { const cx = R(x0, x1), cy = R(y0 + 6, y0 + 30); for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(cx + k * 9, cy + (k % 2) * -4, 8 + (k % 2) * 3, 0, 7); x.fill(); } }
  // 远楼
  let px = x0 - 10; while (px < x1) { const w = R(16, 30), h = R(30, 60); x.fillStyle = o.far; x.fillRect(px, y1 - h, w, h); px += w + R(2, 6); }
  // 近楼 + 窗
  px = x0 - 6; while (px < x1) { const w = R(22, 40), h = R(20, 48); x.fillStyle = o.near; x.fillRect(px, y1 - h, w, h);
    for (let wy = y1 - h + 4; wy < y1 - 3; wy += 6) for (let wx = px + 3; wx < px + w - 4; wx += 6) { x.fillStyle = rnd() < o.lit ? o.win : 'rgba(255,255,255,.12)'; x.fillRect(wx, wy, 3, 3); }
    if (rnd() < .3) { x.fillStyle = o.near; x.fillRect(px + w / 2 - 1, y1 - h - 10, 2, 10); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(px + w / 2, y1 - h - 10, 1.6, 0, 7); x.fill(); }
    px += w + R(1, 4); }
  // 玻璃反光斜条
  x.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 4; i++) { const sx = x0 + i * 58 + 10; x.beginPath(); x.moveTo(sx, y0); x.lineTo(sx + 16, y0); x.lineTo(sx - 30, y1); x.lineTo(sx - 46, y1); x.fill(); }
  x.restore();
}
// 打卡机（挂墙）
function punchClock(x, px, py, s, o = {}) {
  x.save(); x.translate(px, py);
  x.fillStyle = '#e8e2d6'; rr(x, -26, -34, 52, 68, 8); x.fill(); x.strokeStyle = INK; x.lineWidth = 2.5; x.stroke();
  x.fillStyle = '#1a1a22'; rr(x, -20, -28, 40, 18, 4); x.fill();
  txt(x, s, 0, -19, { font: LF, size: 13, color: o.red ? '#ff3a3a' : '#ff6a3a', align: 'center', shadow: '#ff3a3a', blur: 6 });
  x.fillStyle = '#4a4458'; rr(x, -14, -4, 28, 5, 2); x.fill();
  txt(x, '打卡', 0, 12, { font: KF, size: 11, color: INK, align: 'center' });
  // 卡架
  x.fillStyle = '#c9b48a'; rr(x, -22, 20, 44, 12, 3); x.fill(); x.stroke();
  for (let i = 0; i < 6; i++) { x.fillStyle = ['#fff', '#ffe08a', '#bfe4ff'][i % 3]; x.fillRect(-19 + i * 7, 14, 5, 10); }
  x.restore();
}
function plantPot(x, px, py, s = 1) {
  x.save(); x.translate(px, py); x.scale(s, s); x.strokeStyle = INK; x.lineWidth = 2;
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .38; x.fillStyle = i % 2 ? '#3a9a4a' : '#4ab85a'; x.beginPath(); x.ellipse(Math.cos(a) * 16, -16 + Math.sin(a) * 14, 7, 15, a + Math.PI / 2, 0, 7); x.fill(); x.stroke(); x.strokeStyle = 'rgba(42,36,64,.4)'; x.beginPath(); x.moveTo(0, -6); x.lineTo(Math.cos(a) * 16, -16 + Math.sin(a) * 14); x.stroke(); x.strokeStyle = INK; }
  x.fillStyle = '#f2f2f2'; rr(x, -12, -6, 24, 20, 4); x.fill(); x.stroke(); x.fillStyle = '#e0603a'; x.fillRect(-12, 0, 24, 4);
  x.restore();
}
// 整个大堂：墙（柱 + 落地窗 + 护墙板）+ 大理石地面
function lobbyBg(x, o = {}) {
  const th = o.theme || {};
  // 地面
  const fg = x.createLinearGradient(0, 196, 0, H); fg.addColorStop(0, th.floor0 || '#efe9e0'); fg.addColorStop(1, th.floor1 || '#e2d8ca'); x.fillStyle = fg; x.fillRect(0, 196, W, H - 196);
  for (let j = 0; j < 13; j++) for (let i = 0; i < 9; i++) { if ((i + j) % 2) { x.fillStyle = 'rgba(120,100,80,.06)'; x.fillRect(i * 48, 196 + j * 48, 48, 48); } }
  x.strokeStyle = 'rgba(120,100,80,.14)'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(i * 48, 196); x.lineTo(i * 48, H); x.stroke(); } for (let j = 0; j < 13; j++) { x.beginPath(); x.moveTo(0, 196 + j * 48); x.lineTo(W, 196 + j * 48); x.stroke(); }
  // 窗光投到地上 + 地砖反光
  x.fillStyle = 'rgba(255,255,240,.28)'; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(100 + i * 70, 196); x.lineTo(150 + i * 70, 196); x.lineTo(110 + i * 70, 300); x.lineTo(60 + i * 70, 300); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 10; i++) { const rx = R(0, W), ry = R(480, 760); x.fillRect(rx, ry, R(10, 26), 2); }
  // 墙
  x.fillStyle = th.wall || '#dfe8f2'; x.fillRect(0, 0, W, 196);
  // 天花 + 筒灯
  x.fillStyle = th.ceil || '#c9d4e2'; x.fillRect(0, 0, W, 96);
  for (let i = 0; i < 5; i++) { const lx = 39 + i * 78; const lg = x.createRadialGradient(lx, 92, 1, lx, 92, 26); lg.addColorStop(0, 'rgba(255,255,230,.9)'); lg.addColorStop(1, 'rgba(255,255,230,0)'); x.fillStyle = lg; x.fillRect(lx - 26, 70, 52, 30); }
  // 落地窗
  city(x, 86, 100, 304, 172, { sky: th.sky || ['#8ccfff', '#d8f0ff'], far: th.far || '#a8c4dc', near: th.near || '#6a8aac', win: th.win || '#fff2a8', lit: th.lit ?? .35, sun: th.sun });
  x.strokeStyle = '#5a6478'; x.lineWidth = 5; x.strokeRect(86, 100, 218, 72); x.lineWidth = 3; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(86 + i * 54.5, 100); x.lineTo(86 + i * 54.5, 172); x.stroke(); }
  // 左柱：打卡机；右柱：全勤海报
  for (const [a, b] of [[0, 86], [304, 390]]) { const pg = x.createLinearGradient(a, 0, b, 0); pg.addColorStop(0, th.pil0 || '#cdd6e2'); pg.addColorStop(.5, th.pil1 || '#eef2f8'); pg.addColorStop(1, th.pil0 || '#cdd6e2'); x.fillStyle = pg; x.fillRect(a, 96, b - a, 100); }
  punchClock(x, 43, 140, o.punch || '08:50', { red: o.redPunch });
  x.save(); x.translate(347, 138); x.rotate(.04); x.fillStyle = '#fff'; rr(x, -30, -30, 60, 62, 4); x.fill(); x.strokeStyle = INK; x.lineWidth = 2.5; x.stroke();
  x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(0, -8, 12, 0, 7); x.fill(); x.stroke(); txt(x, '★', 0, -8, { size: 13, color: '#e0603a', align: 'center' });
  txt(x, '本月全勤', 0, 13, { font: KF, size: 11, color: INK, align: 'center' }); txt(x, '奖 ¥200', 0, 25, { font: KF, size: 10, color: '#e0603a', align: 'center' });
  x.fillStyle = '#e04a4a'; x.beginPath(); x.arc(0, -28, 3, 0, 7); x.fill(); x.restore();
  // 护墙板 + 公司铭牌
  x.fillStyle = th.wain || '#b8875a'; x.fillRect(0, 172, W, 24); x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 13; i++) x.fillRect(i * 32, 172, 2, 24); x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(0, 172, W, 3);
  x.save(); rr(x, 128, 175, 134, 19, 4); x.fillStyle = '#2a2a3a'; x.fill(); x.restore();
  txt(x, '喵喵科技 · MEOW TECH · A梯', 195, 185, { font: KF, size: 11, color: '#ffd84a', align: 'center' });
  // 角落：绿植 + 垃圾桶 + 小心地滑
  plantPot(x, 22, 300, 1.05); plantPot(x, 368, 486, .9);
  x.save(); x.fillStyle = '#9aa3b8'; rr(x, 356, 284, 24, 30, 4); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.fillStyle = '#6a7388'; x.fillRect(356, 284, 24, 6); x.restore();
  x.save(); x.translate(24, 420); x.fillStyle = '#ffd84a'; x.beginPath(); x.moveTo(0, -22); x.lineTo(14, 18); x.lineTo(-14, 18); x.closePath(); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); txt(x, '!', 0, 4, { font: LF, size: 16, color: INK, align: 'center' }); x.restore();
  txt(x, '小心地滑', 24, 450, { font: KF, size: 9, color: INK, align: 'center' });
  if (o.alarm) { // 警报斜纹 + 墙面红光
    x.save(); x.beginPath(); x.rect(0, 0, W, 196); x.clip(); x.globalAlpha = .16; x.fillStyle = '#e04a4a'; for (let i = -10; i < 20; i++) { x.beginPath(); x.moveTo(i * 40, 96); x.lineTo(i * 40 + 20, 96); x.lineTo(i * 40 - 80, 196); x.lineTo(i * 40 - 100, 196); x.fill(); } x.restore();
    for (const lx of [10, 380]) { const ag = x.createRadialGradient(lx, 110, 2, lx, 110, 70); ag.addColorStop(0, 'rgba(255,60,40,.7)'); ag.addColorStop(1, 'rgba(255,60,40,0)'); x.fillStyle = ag; x.fillRect(lx - 70, 40, 140, 140); x.fillStyle = '#ff3a2a'; x.beginPath(); x.arc(lx, 110, 6, 0, 7); x.fill(); }
  }
}
// 挂横幅
function banner(x, s, col = '#e0603a') {
  x.save(); x.strokeStyle = '#5a6478'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(100, 100); x.lineTo(112, 110); x.moveTo(290, 100); x.lineTo(278, 110); x.stroke();
  x.beginPath(); x.moveTo(104, 108); x.lineTo(286, 108); x.lineTo(280, 120); x.lineTo(286, 132); x.lineTo(104, 132); x.lineTo(110, 120); x.closePath(); x.fillStyle = col; x.fill(); x.strokeStyle = INK; x.lineWidth = 2.5; x.stroke(); x.restore();
  txt(x, s, 195, 121, { font: KF, size: 13, color: '#fff', align: 'center' });
}

// ———————————————— 轿厢 ————————————————
function cabin(x, cols, rows, o = {}) {
  const w = cols * CELL, h = rows * CELL, gx = (W - w) / 2, T = 16;
  x.save();
  x.fillStyle = 'rgba(30,30,60,.28)'; rr(x, gx - T + 8, GY - T + 12, w + 2 * T, h + 2 * T + 14, 18); x.fill();
  const mg = x.createLinearGradient(gx - T, 0, gx + w + T, 0); mg.addColorStop(0, '#8e98ae'); mg.addColorStop(.2, '#dfe4ee'); mg.addColorStop(.5, '#aab2c4'); mg.addColorStop(.8, '#e8ecf4'); mg.addColorStop(1, '#8e98ae');
  x.fillStyle = mg; rr(x, gx - T, GY - T, w + 2 * T, h + 2 * T + 12, 16); x.fill(); x.strokeStyle = INK; x.lineWidth = 4; x.stroke();
  x.save(); x.clip(); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1; for (let yy = GY - T; yy < GY + h + T + 12; yy += 3) { x.beginPath(); x.moveTo(gx - T, yy); x.lineTo(gx + w + T, yy); x.stroke(); } x.restore();
  // 顶壁镜面 + 通风格栅
  const mi = x.createLinearGradient(0, GY - T, 0, GY); mi.addColorStop(0, '#d8f0ff'); mi.addColorStop(1, '#a8cfe8'); x.fillStyle = mi; rr(x, gx + 34, GY - T + 3, w - 68, T - 6, 3); x.fill(); x.strokeStyle = 'rgba(42,36,64,.5)'; x.lineWidth = 1.5; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(gx + 60 + i * 60, GY - T + 4); x.lineTo(gx + 52 + i * 60, GY - 3); x.stroke(); }
  x.fillStyle = '#5a6478'; for (let i = 0; i < 5; i++) x.fillRect(gx + w - 30 + i * 4, GY - T + 4, 2, T - 8);
  // 监控摄像头
  x.fillStyle = '#2a2a3a'; x.beginPath(); x.arc(gx - 4, GY - 4, 7, 0, 7); x.fill(); x.fillStyle = '#ff3a3a'; x.beginPath(); x.arc(gx - 2, GY - 2, 2, 0, 7); x.fill();
  // 左壁广告屏
  const ad = x.createLinearGradient(0, GY + 24, 0, GY + 104); ad.addColorStop(0, '#ff9a6a'); ad.addColorStop(1, '#ff5a8a'); x.fillStyle = '#1a1a22'; rr(x, gx - T + 3, GY + 22, T - 6, 84, 3); x.fill(); x.fillStyle = ad; rr(x, gx - T + 5, GY + 24, T - 10, 80, 2); x.fill();
  txt(x, '咖啡买一送一', gx - T / 2, GY + 64, { font: KF, size: 7.5, color: '#fff', align: 'center', rot: -Math.PI / 2 });
  // 右壁楼层按钮
  x.fillStyle = '#c9ced9'; rr(x, gx + w + 3, GY + 24, T - 6, 92, 3); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.5; x.stroke();
  for (let i = 0; i < 8; i++) { const lit = (o.lit || [2, 5]).includes(i); x.fillStyle = lit ? '#ffb030' : '#f2f2f2'; x.beginPath(); x.arc(gx + w + 8, GY + 32 + i * 10.5, 3.2, 0, 7); x.fill(); if (lit) { x.save(); x.shadowColor = '#ffb030'; x.shadowBlur = 6; x.fill(); x.restore(); } }
  // 地板：双色方砖 + 菱形镶嵌
  x.fillStyle = o.floor || '#f2e8d8'; rr(x, gx, GY, w, h, 6); x.fill();
  x.save(); rr(x, gx, GY, w, h, 6); x.clip();
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { if ((c + r) % 2) { x.fillStyle = o.floor2 || 'rgba(160,120,80,.12)'; x.fillRect(gx + c * CELL, GY + r * CELL, CELL, CELL); }
    const mx = gx + c * CELL + CELL / 2, my = GY + r * CELL + CELL / 2; x.fillStyle = 'rgba(160,120,80,.14)'; x.beginPath(); x.moveTo(mx, my - 6); x.lineTo(mx + 6, my); x.lineTo(mx, my + 6); x.lineTo(mx - 6, my); x.fill(); }
  for (const lx of [gx + w * .3, gx + w * .72]) { const lg = x.createRadialGradient(lx, GY + h * .35, 4, lx, GY + h * .35, 70); lg.addColorStop(0, 'rgba(255,255,240,.45)'); lg.addColorStop(1, 'rgba(255,255,240,0)'); x.fillStyle = lg; x.fillRect(gx, GY, w, h); }
  x.restore();
  x.strokeStyle = 'rgba(42,36,64,.16)'; x.lineWidth = 1.5; x.setLineDash([4, 4]);
  for (let i = 1; i < cols; i++) { x.beginPath(); x.moveTo(gx + i * CELL, GY); x.lineTo(gx + i * CELL, GY + h); x.stroke(); }
  for (let j = 1; j < rows; j++) { x.beginPath(); x.moveTo(gx, GY + j * CELL); x.lineTo(gx + w, GY + j * CELL); x.stroke(); }
  x.setLineDash([]);
  // 扶手（左/上/右）
  x.lineCap = 'round'; for (const [c, lw] of [['#7a8296', 5], ['#e8ecf4', 2]]) { x.strokeStyle = c; x.lineWidth = lw; x.beginPath(); x.moveTo(gx + 5, GY + h - 12); x.lineTo(gx + 5, GY + 5); x.lineTo(gx + w - 5, GY + 5); x.lineTo(gx + w - 5, GY + h - 12); x.stroke(); }
  // 门槛 + 两扇门（dg = 关闭程度 0..1）
  const ty = GY + h + 2, dg = o.door ?? 0, half = w / 2;
  x.fillStyle = '#5a6478'; x.fillRect(gx - 4, ty, w + 8, 14); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(gx, ty + 4 + i * 3); x.lineTo(gx + w, ty + 4 + i * 3); x.stroke(); }
  const dgm = x.createLinearGradient(0, ty, 0, ty + 14); dgm.addColorStop(0, '#eef2f8'); dgm.addColorStop(1, '#9aa3b8');
  const pw = half * dg; x.fillStyle = dgm; x.fillRect(gx, ty - 1, pw, 15); x.fillRect(gx + w - pw, ty - 1, pw, 15);
  x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(gx, ty - 1, pw, 15); x.strokeRect(gx + w - pw, ty - 1, pw, 15);
  if (dg > 0 && dg < 1) { const gl = x.createLinearGradient(gx + pw, 0, gx + w - pw, 0); gl.addColorStop(0, 'rgba(255,230,140,0)'); gl.addColorStop(.5, 'rgba(255,230,140,.9)'); gl.addColorStop(1, 'rgba(255,230,140,0)'); x.fillStyle = gl; x.fillRect(gx + pw, ty + 3, w - 2 * pw, 8); }
  x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(gx - 4, ty, w + 8, 14);
  x.restore();
  return gx;
}
const at = (gx, c, r) => [gx + c * CELL + CELL / 2, GY + r * CELL + CELL / 2];
function cellMark(x, gx, c, r, col, o = {}) {
  x.save(); x.fillStyle = col; x.globalAlpha = o.a || .35; rr(x, gx + c * CELL + 3, GY + r * CELL + 3, CELL - 6, CELL - 6, 8); x.fill();
  if (o.dash) { x.globalAlpha = 1; x.setLineDash([5, 4]); x.strokeStyle = col; x.lineWidth = 2.5; x.stroke(); }
  x.restore();
}

// ———————————————— 人物 ————————————————
// o: s shirt outfit(suit/shirt/hoodie/vest) tie hair(short/part/pony/bun/curly/buzz/bald/long) hairCol skin face(ok/happy/yawn/phone/panic/angry/sleepy)
//    glasses phones(耳机) tired(黑眼圈) bag(backpack/brief) badge sweat smoke zzz
function worker(x, cx, cy, o = {}) {
  const s = o.s || 1, sh = o.shirt || '#5a8ae0', hc = o.hairCol || '#3a2a20', sk = o.skin || SKIN[0];
  x.save(); x.translate(cx, cy); x.scale(s, s); if (o.alpha != null) x.globalAlpha = o.alpha;
  x.lineJoin = 'round'; x.lineCap = 'round';
  x.fillStyle = 'rgba(30,30,60,.16)'; x.beginPath(); x.ellipse(0, 20, 22, 7, 0, 0, 7); x.fill();
  x.strokeStyle = INK; x.lineWidth = 2.5;
  if (o.bag === 'backpack') { x.fillStyle = o.bagCol || '#3a5a8a'; rr(x, -16, -10, 32, 16, 7); x.fill(); x.stroke(); }
  if (o.hair === 'long') { x.fillStyle = hc; rr(x, -18, -18, 36, 30, 10); x.fill(); x.stroke(); }
  if (o.outfit === 'hoodie') { x.fillStyle = sh; rr(x, -15, -10, 30, 14, 7); x.fill(); x.stroke(); }
  // 身体
  x.fillStyle = o.outfit === 'vest' ? '#fff' : sh; rr(x, -18, -2, 36, 24, 10); x.fill(); x.stroke();
  if (o.outfit === 'suit') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-7, -1); x.lineTo(7, -1); x.lineTo(0, 14); x.closePath(); x.fill(); x.strokeStyle = 'rgba(42,36,64,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-7, -1); x.lineTo(-2, 16); x.moveTo(7, -1); x.lineTo(2, 16); x.stroke(); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(0, 18, 1.6, 0, 7); x.fill(); }
  if (o.outfit === 'vest') { x.fillStyle = o.vest || '#3a3a4a'; x.beginPath(); x.moveTo(-18, 4); x.lineTo(-4, 2); x.lineTo(-1, 22); x.lineTo(-16, 22); x.closePath(); x.fill(); x.beginPath(); x.moveTo(18, 4); x.lineTo(4, 2); x.lineTo(1, 22); x.lineTo(16, 22); x.closePath(); x.fill(); x.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-3, 9 + i * 5, 1.2, 0, 7); x.fill(); } }
  if (o.outfit === 'hoodie') { x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-4, 0); x.lineTo(-5, 9); x.moveTo(4, 0); x.lineTo(5, 9); x.stroke(); x.strokeStyle = 'rgba(42,36,64,.35)'; x.beginPath(); x.moveTo(-9, 14); x.lineTo(9, 14); x.stroke(); }
  if (!o.outfit || o.outfit === 'shirt') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-8, -1); x.lineTo(0, 4); x.lineTo(-3, -2); x.fill(); x.beginPath(); x.moveTo(8, -1); x.lineTo(0, 4); x.lineTo(3, -2); x.fill(); }
  if (o.tie) { x.fillStyle = o.tie; x.strokeStyle = INK; x.lineWidth = 1; x.beginPath(); x.moveTo(-2.5, 1); x.lineTo(2.5, 1); x.lineTo(3.5, 13); x.lineTo(0, 17); x.lineTo(-3.5, 13); x.closePath(); x.fill(); x.stroke(); }
  if (o.bag === 'backpack') { x.strokeStyle = o.bagCol || '#3a5a8a'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(-11, -1); x.lineTo(-12, 16); x.moveTo(11, -1); x.lineTo(12, 16); x.stroke(); }
  // 工牌
  if (o.badge !== false && o.outfit !== 'vest') { x.strokeStyle = o.lan || '#e04a4a'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-6, -1); x.lineTo(-1, 10); x.moveTo(6, -1); x.lineTo(1, 10); x.stroke(); x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = 1.2; rr(x, -5, 10, 10, 9, 1.5); x.fill(); x.stroke(); x.fillStyle = o.lan || '#e04a4a'; x.fillRect(-5, 10, 10, 2.5); }
  // 手 + 公文包
  if (o.bag === 'brief') { x.fillStyle = '#6a4a2a'; x.strokeStyle = INK; x.lineWidth = 2; rr(x, 14, 8, 16, 12, 2); x.fill(); x.stroke(); x.beginPath(); x.moveTo(19, 8); x.lineTo(19, 5); x.lineTo(25, 5); x.lineTo(25, 8); x.stroke(); x.fillStyle = sk; x.beginPath(); x.arc(17, 7, 3.5, 0, 7); x.fill(); x.stroke(); }
  // 头
  x.strokeStyle = INK; x.lineWidth = 2.5;
  x.fillStyle = sk; for (const ex of [-15, 15]) { x.beginPath(); x.arc(ex, -11, 4, 0, 7); x.fill(); x.stroke(); }
  x.beginPath(); x.arc(0, -12, 15, 0, 7); x.fill(); x.stroke();
  // 发型
  const hair = o.hair || 'short'; x.fillStyle = hc;
  const cap = () => { x.beginPath(); x.arc(0, -14, 15.5, Math.PI * 1.04, Math.PI * 1.96); x.quadraticCurveTo(6, -20, 0, -19); x.quadraticCurveTo(-8, -21, -15, -17); x.closePath(); x.fill(); };
  if (hair === 'short' || hair === 'long') cap();
  if (hair === 'part') { cap(); x.beginPath(); x.moveTo(-15, -15); x.quadraticCurveTo(-4, -32, 14, -20); x.quadraticCurveTo(2, -22, -6, -16); x.fill(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-6, -27); x.quadraticCurveTo(0, -24, 4, -22); x.stroke(); }
  if (hair === 'pony') { cap(); x.beginPath(); x.ellipse(14, -24, 6, 9, .6, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.6; x.stroke(); x.fillStyle = '#ff6a8a'; x.beginPath(); x.arc(10, -22, 2.4, 0, 7); x.fill(); }
  if (hair === 'bun') { cap(); x.beginPath(); x.arc(0, -30, 7, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.6; x.stroke(); x.strokeStyle = '#ffd84a'; x.lineWidth = 2; x.beginPath(); x.moveTo(-8, -34); x.lineTo(8, -27); x.stroke(); }
  if (hair === 'curly') { for (let a = Math.PI * .95; a <= Math.PI * 2.05; a += .32) { x.beginPath(); x.arc(Math.cos(a) * 13, -13 + Math.sin(a) * 13, 6, 0, 7); x.fill(); } }
  if (hair === 'buzz') { x.globalAlpha *= .55; cap(); x.globalAlpha = o.alpha ?? 1; x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(((i * 37) % 22) - 11, -25 + ((i * 53) % 7), .8, 0, 7); x.fill(); } }
  if (hair === 'bald') { x.fillStyle = 'rgba(255,255,255,.65)'; x.beginPath(); x.ellipse(-5, -22, 5, 2.5, -.4, 0, 7); x.fill(); x.fillStyle = hc; for (const ex of [-13, 13]) { x.beginPath(); x.ellipse(ex, -14, 3, 5, 0, 0, 7); x.fill(); } }
  // 表情
  const f = o.face || 'ok'; x.fillStyle = INK; x.strokeStyle = INK; x.lineWidth = 2;
  if (o.tired) { x.strokeStyle = '#9a7ac0'; x.lineWidth = 1.6; for (const ex of [-5, 5]) { x.beginPath(); x.arc(ex, -8, 3.5, .3, Math.PI - .3); x.stroke(); } x.strokeStyle = INK; x.lineWidth = 2; }
  if (f === 'ok') { x.beginPath(); x.arc(-5, -11, 2, 0, 7); x.arc(5, -11, 2, 0, 7); x.fill(); x.beginPath(); x.arc(0, -6, 4, .2, Math.PI - .2); x.stroke(); }
  if (f === 'happy') { for (const ex of [-5, 5]) { x.beginPath(); x.arc(ex, -10, 3, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); } x.fillStyle = '#c0403a'; x.beginPath(); x.arc(0, -5, 4.5, 0, Math.PI); x.fill(); x.fillStyle = 'rgba(255,120,120,.45)'; x.beginPath(); x.arc(-10, -6, 3, 0, 7); x.arc(10, -6, 3, 0, 7); x.fill(); }
  if (f === 'yawn') { for (const ex of [-5, 5]) { x.beginPath(); x.moveTo(ex - 3, -11); x.quadraticCurveTo(ex, -9, ex + 3, -11); x.stroke(); } x.fillStyle = '#5a2030'; x.beginPath(); x.ellipse(0, -3, 4, 5, 0, 0, 7); x.fill(); x.fillStyle = '#e06a7a'; x.beginPath(); x.ellipse(0, -1, 2.5, 2, 0, 0, 7); x.fill(); x.fillStyle = '#8ad0ff'; x.beginPath(); x.arc(-9, -9, 1.6, 0, 7); x.fill(); }
  if (f === 'phone') { x.beginPath(); x.arc(-4, -8, 1.8, 0, 7); x.arc(4, -8, 1.8, 0, 7); x.fill(); x.beginPath(); x.moveTo(-2, -3); x.lineTo(2, -3); x.stroke();
    const pg = x.createRadialGradient(0, -2, 1, 0, -2, 16); pg.addColorStop(0, 'rgba(140,220,255,.55)'); pg.addColorStop(1, 'rgba(140,220,255,0)'); x.fillStyle = pg; x.beginPath(); x.arc(0, -2, 16, 0, 7); x.fill();
    x.fillStyle = '#2a2a3a'; rr(x, -6, 0, 12, 9, 2); x.fill(); x.fillStyle = '#8ad8ff'; x.fillRect(-4.5, 1.5, 9, 6); x.fillStyle = sk; x.beginPath(); x.arc(-7, 6, 3, 0, 7); x.arc(7, 6, 3, 0, 7); x.fill(); }
  if (f === 'panic') { x.fillStyle = '#fff'; for (const ex of [-5, 5]) { x.beginPath(); x.arc(ex, -11, 4, 0, 7); x.fill(); x.stroke(); } x.fillStyle = INK; x.beginPath(); x.arc(-5, -10, 1.6, 0, 7); x.arc(5, -10, 1.6, 0, 7); x.fill(); x.beginPath(); x.moveTo(-5, -3); x.lineTo(-2.5, -5); x.lineTo(0, -3); x.lineTo(2.5, -5); x.lineTo(5, -3); x.stroke(); x.fillStyle = 'rgba(120,140,220,.35)'; x.fillRect(-12, -26, 24, 6); }
  if (f === 'angry') { x.lineWidth = 2.4; x.beginPath(); x.moveTo(-9, -17); x.lineTo(-3, -13); x.moveTo(9, -17); x.lineTo(3, -13); x.stroke(); x.beginPath(); x.arc(-5, -10, 2, 0, 7); x.arc(5, -10, 2, 0, 7); x.fill(); x.lineWidth = 2; x.beginPath(); x.arc(0, -1, 4, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); x.fillStyle = 'rgba(255,80,60,.4)'; x.beginPath(); x.arc(-10, -6, 3, 0, 7); x.arc(10, -6, 3, 0, 7); x.fill(); }
  if (f === 'sleepy') { x.beginPath(); x.moveTo(-8, -10); x.lineTo(-2, -10); x.moveTo(2, -10); x.lineTo(8, -10); x.stroke(); x.beginPath(); x.ellipse(0, -3, 2.5, 2, 0, 0, 7); x.stroke(); }
  if (o.glasses) { x.strokeStyle = INK; x.lineWidth = 1.6; x.fillStyle = 'rgba(200,230,255,.35)'; for (const ex of [-5, 5]) { x.beginPath(); x.arc(ex, -11, 4.8, 0, 7); x.fill(); x.stroke(); } x.beginPath(); x.moveTo(-.5, -11); x.lineTo(.5, -11); x.stroke(); }
  if (o.phones) { x.strokeStyle = o.phones; x.lineWidth = 3; x.beginPath(); x.arc(0, -13, 17, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); x.fillStyle = o.phones; x.strokeStyle = INK; x.lineWidth = 1.5; for (const ex of [-17, 17]) { rr(x, ex - 4, -17, 8, 11, 3); x.fill(); x.stroke(); } }
  // 汗 / 烟 / Z
  if (o.sweat) { x.fillStyle = '#8ad0ff'; x.strokeStyle = INK; x.lineWidth = 1.2; for (const [sx2, sy2, k] of [[16, -24, 1], [-17, -20, .7]]) { x.beginPath(); x.moveTo(sx2, sy2 - 6 * k); x.quadraticCurveTo(sx2 + 4 * k, sy2, sx2, sy2 + 3 * k); x.quadraticCurveTo(sx2 - 4 * k, sy2, sx2, sy2 - 6 * k); x.fill(); x.stroke(); } }
  if (o.smoke) { x.fillStyle = 'rgba(120,110,130,.75)'; for (const [px, py, r] of [[-8, -32, 5], [0, -38, 6], [9, -33, 5], [3, -46, 4]]) { x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } }
  if (o.zzz) { txt(x, 'z', 16, -28, { font: LF, size: 11, color: '#7a8ad0', align: 'center' }); txt(x, 'Z', 23, -38, { font: LF, size: 14, color: '#7a8ad0', align: 'center' }); }
  x.restore();
}

// ———————————————— 携带物 ————————————————
function prop(x, kind, cx, cy, o = {}) {
  x.save(); x.translate(cx, cy); if (o.s) x.scale(o.s, o.s); x.strokeStyle = INK; x.lineWidth = 2.2; x.lineJoin = 'round'; x.lineCap = 'round';
  if (kind === 'box') { x.fillStyle = '#d9a866'; rr(x, -40, -16, 80, 32, 4); x.fill(); x.stroke(); x.fillStyle = '#c4904c'; x.fillRect(-40, -16, 80, 7); x.strokeRect(-40, -16, 80, 7); x.fillStyle = 'rgba(255,255,230,.6)'; x.fillRect(-4, -16, 8, 32);
    x.fillStyle = '#fff'; rr(x, 10, -4, 26, 14, 2); x.fill(); x.lineWidth = 1.2; x.stroke(); txt(x, '文件', 23, 3, { font: KF, size: 9, color: INK, align: 'center' }); txt(x, '↑↑', -24, 4, { size: 11, color: INK, align: 'center' }); }
  if (kind === 'coffee') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(-7, -9); x.lineTo(7, -9); x.lineTo(5, 9); x.lineTo(-5, 9); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#8a5a3a'; x.fillRect(-6.5, -3, 13, 6); x.fillStyle = '#5a3a2a'; rr(x, -9, -12, 18, 4, 2); x.fill(); x.stroke(); txt(x, '喵', 0, 0, { font: KF, size: 6, color: '#fff', align: 'center' });
    x.strokeStyle = 'rgba(160,160,170,.85)'; x.lineWidth = 2; for (const dx of [-3, 3]) { x.beginPath(); x.moveTo(dx, -15); x.quadraticCurveTo(dx + 4, -20, dx, -25); x.quadraticCurveTo(dx - 3, -29, dx + 1, -33); x.stroke(); } }
  if (kind === 'bike') { x.lineWidth = 2.5; for (const wx of [-22, 22]) { x.fillStyle = 'rgba(42,36,64,.08)'; x.beginPath(); x.arc(wx, 0, 13, 0, 7); x.fill(); x.stroke(); x.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; x.beginPath(); x.moveTo(wx, 0); x.lineTo(wx + Math.cos(a) * 12, Math.sin(a) * 12); x.stroke(); } x.lineWidth = 2.5; }
    x.strokeStyle = '#e04a4a'; x.lineWidth = 3.2; x.beginPath(); x.moveTo(-22, 0); x.lineTo(-6, -16); x.lineTo(14, -16); x.lineTo(22, 0); x.moveTo(-6, -16); x.lineTo(2, 0); x.lineTo(-22, 0); x.moveTo(14, -16); x.lineTo(12, -24); x.stroke();
    x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(6, -24); x.lineTo(18, -24); x.stroke(); x.fillStyle = INK; rr(x, -12, -21, 12, 4, 2); x.fill(); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(2, 0, 3, 0, 7); x.fill(); }
  if (kind === 'plant') { plantPot(x, 0, 6, .7); }
  if (kind === 'takeout') { x.fillStyle = '#c99a5a'; x.beginPath(); x.moveTo(-10, -8); x.lineTo(10, -8); x.lineTo(12, 12); x.lineTo(-12, 12); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.arc(0, -8, 5, Math.PI, 0); x.stroke(); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(0, 3, 5, 0, 7); x.fill(); x.lineWidth = 1; x.stroke(); txt(x, '饭', 0, 3.5, { font: KF, size: 6.5, color: INK, align: 'center' }); }
  if (kind === 'parcel') { x.fillStyle = '#c4904c'; rr(x, -13, -10, 26, 20, 2); x.fill(); x.stroke(); x.fillStyle = '#e8d8a8'; x.fillRect(-2.5, -10, 5, 20); x.fillStyle = '#fff'; x.fillRect(4, 1, 8, 7); x.lineWidth = 1; x.strokeRect(4, 1, 8, 7); }
  if (kind === 'skate') { x.fillStyle = '#4ac0d0'; rr(x, -26, -6, 52, 12, 6); x.fill(); x.stroke(); x.fillStyle = 'rgba(42,36,64,.55)'; rr(x, -22, -3.5, 44, 7, 3.5); x.fill(); x.fillStyle = '#ffd84a'; for (const wx of [-16, 16]) for (const wy of [-8, 8]) { x.beginPath(); x.arc(wx, wy, 3, 0, 7); x.fill(); x.lineWidth = 1.2; x.stroke(); } }
  if (kind === 'dog') { x.fillStyle = '#f0a050'; x.beginPath(); x.ellipse(0, 0, 16, 9, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(2, 4, 9, 4, 0, 0, 7); x.fill();
    x.fillStyle = '#f0a050'; for (const lx of [-10, -3, 6, 12]) { x.fillRect(lx - 2, 6, 4, 6); x.strokeRect(lx - 2, 6, 4, 6); }
    x.beginPath(); x.arc(16, -6, 8, 0, 7); x.fill(); x.stroke(); for (const ex of [11, 20]) { x.beginPath(); x.moveTo(ex - 3, -11); x.lineTo(ex, -20); x.lineTo(ex + 3, -11); x.closePath(); x.fill(); x.stroke(); }
    x.fillStyle = INK; x.beginPath(); x.arc(14, -7, 1.3, 0, 7); x.arc(19, -7, 1.3, 0, 7); x.arc(17, -3, 1.6, 0, 7); x.fill(); x.fillStyle = '#e04a4a'; x.fillRect(9, 0, 10, 2.5); x.beginPath(); x.moveTo(-16, -2); x.quadraticCurveTo(-22, -10, -19, -14); x.stroke(); }
  if (kind === 'thermos') { x.fillStyle = '#c0403a'; rr(x, -5, -12, 10, 22, 3); x.fill(); x.stroke(); x.fillStyle = '#e0e0e8'; rr(x, -6, -15, 12, 5, 2); x.fill(); x.stroke(); x.fillStyle = '#ffd84a'; x.fillRect(-5, -2, 10, 3); }
  x.restore();
}
function tag(x, px, py, s, col, tc = '#fff') { x.save(); x.font = `12px ${KF}`; const w = x.measureText(s).width + 14; rr(x, px - w / 2, py - 11, w, 22, 11); x.fillStyle = col; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.restore(); txt(x, s, px, py, { font: KF, size: 12, color: tc, align: 'center' }); }
function bubble(x, px, py, s, col = '#fff', tc = INK, size = 15) { x.save(); x.font = `${size}px ${KF}`; const w = x.measureText(s).width + 22; rr(x, px - w / 2, py - 16, w, 32, 16); x.fillStyle = col; x.fill(); x.strokeStyle = INK; x.lineWidth = 2.5; x.stroke(); x.beginPath(); x.moveTo(px - 6, py + 15); x.lineTo(px, py + 25); x.lineTo(px + 6, py + 15); x.fill(); x.stroke(); x.fillStyle = col; x.fillRect(px - 5, py + 12, 10, 4); x.restore(); txt(x, s, px, py, { font: KF, size, color: tc, align: 'center' }); }
function star(x, px, py, r, col = '#ffd84a') { x.save(); x.translate(px, py); x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } x.closePath(); x.fillStyle = col; x.fill(); x.strokeStyle = INK; x.lineWidth = 1.6; x.stroke(); x.restore(); }
function bolt(x, px, py, s = 1) { x.save(); x.translate(px, py); x.scale(s, s); x.beginPath(); x.moveTo(-2, -14); x.lineTo(7, -14); x.lineTo(2, -3); x.lineTo(8, -3); x.lineTo(-5, 14); x.lineTo(-1, 1); x.lineTo(-7, 1); x.closePath(); x.fillStyle = '#ffd84a'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.restore(); }
function finger(x, px, py) { x.save(); x.translate(px, py); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(0, 0, 20, 0, 7); x.fill(); x.fillStyle = '#ffd9b8'; x.strokeStyle = INK; x.lineWidth = 2.2; rr(x, -6, -4, 12, 30, 6); x.fill(); x.stroke(); rr(x, -12, 14, 26, 22, 8); x.fill(); x.stroke(); x.fillStyle = '#fff'; rr(x, -3, -2, 6, 6, 2); x.fill(); x.restore(); }

// ———————————————— HUD ————————————————
function hud(x, o) {
  // 楼层 LED
  x.save(); rr(x, 12, 12, 132, 58, 12); const lg = x.createLinearGradient(0, 12, 0, 70); lg.addColorStop(0, '#3a3a48'); lg.addColorStop(1, '#14141c'); x.fillStyle = lg; x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke(); x.restore();
  x.fillStyle = 'rgba(255,106,58,.12)'; for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) x.fillRect(22 + i * 5, 24 + j * 7, 3, 4);
  txt(x, o.floor, 50, 42, { font: LF, size: 30, color: '#ff6a3a', align: 'center', shadow: '#ff6a3a', blur: 12 });
  for (let i = 0; i < 3; i++) txt(x, '▲', 116, 26 + i * 12, { size: 11, color: `rgba(255,106,58,${1 - i * .3})`, align: 'center' });
  txt(x, 'A梯', 94, 60, { font: KF, size: 10, color: '#9aa0b8', align: 'center' });
  if (o.ding) { star(x, 136, 16, 8); txt(x, '叮!', 128, 82, { font: KF, size: 16, color: '#ffd84a', align: 'center', stroke: INK, sw: 4, rot: -.15 }); }
  // 挂钟
  const cx = 195, cy = 48, r = 34;
  if (o.redZone) { const pg = x.createRadialGradient(cx, cy, r, cx, cy, r + 16); pg.addColorStop(0, 'rgba(255,50,40,.7)'); pg.addColorStop(1, 'rgba(255,50,40,0)'); x.fillStyle = pg; x.beginPath(); x.arc(cx, cy, r + 16, 0, 7); x.fill(); }
  x.save(); const rim = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); rim.addColorStop(0, '#f2f4f8'); rim.addColorStop(1, '#8a92a8'); x.fillStyle = rim; x.beginPath(); x.arc(cx, cy, r + 4, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 3.5; x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, r - 1, 0, 7); x.fill();
  if (o.redZone) { x.fillStyle = 'rgba(255,70,70,.4)'; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r - 3, -Math.PI / 2 - o.redZone, -Math.PI / 2); x.fill(); }
  x.strokeStyle = INK; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.lineWidth = i % 3 ? 1.5 : 3; x.beginPath(); x.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)); x.lineTo(cx + Math.cos(a) * (r - (i % 3 ? 8 : 11)), cy + Math.sin(a) * (r - (i % 3 ? 8 : 11))); x.stroke(); }
  txt(x, '喵', cx, cy + 14, { font: KF, size: 8, color: '#9aa0b8', align: 'center' });
  const ma = (o.min / 60) * 6.283 - Math.PI / 2, ha = ((8 + o.min / 60) / 12) * 6.283 - Math.PI / 2;
  x.lineCap = 'round'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ha) * 16, cy + Math.sin(ha) * 16); x.stroke();
  x.strokeStyle = '#e04a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - Math.cos(ma) * 6, cy - Math.sin(ma) * 6); x.lineTo(cx + Math.cos(ma) * 27, cy + Math.sin(ma) * 27); x.stroke();
  x.fillStyle = INK; x.beginPath(); x.arc(cx, cy, 4, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(cx - 10, cy - 14, 14, 6, -.5, 0, 7); x.fill(); x.restore();
  txt(x, o.minTxt || ('8:' + String(Math.floor(o.min)).padStart(2, '0')), cx, cy + 48, { font: LF, size: 18, color: o.redZone ? '#e04a4a' : INK, align: 'center', stroke: '#fff', sw: 4 });
  // 打卡卡片
  x.save(); x.translate(311, 41); x.rotate(.03); rr(x, -64, -29, 128, 58, 8); x.fillStyle = '#ffe48a'; x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
  x.fillStyle = 'rgba(42,36,64,.12)'; for (let i = 0; i < 5; i++) x.fillRect(-58, -18 + i * 9, 30, 2);
  x.strokeStyle = '#e0603a'; x.lineWidth = 2; x.beginPath(); x.arc(-42, 2, 13, 0, 7); x.stroke(); txt(x, '准点', -42, 2, { font: KF, size: 9, color: '#e0603a', align: 'center', rot: -.2 }); x.restore();
  txt(x, '准点打卡', 330, 26, { font: KF, size: 12, color: INK, align: 'center' });
  txt(x, o.score, 330, 50, { font: LF, size: 24, color: INK, align: 'center' });
}
// 大堂排队区：闸机 + 隔离带 + 人群
function queue(x, top, people, o = {}) {
  // 闸机
  for (const [a, b] of [[18, 128], [262, 372]]) {
    for (const px of [a, b]) { x.save(); const g = x.createLinearGradient(px - 8, 0, px + 8, 0); g.addColorStop(0, '#8e98ae'); g.addColorStop(.5, '#e8ecf4'); g.addColorStop(1, '#8e98ae'); x.fillStyle = g; rr(x, px - 8, top - 16, 16, 34, 4); x.fill(); x.strokeStyle = INK; x.lineWidth = 2.2; x.stroke(); x.fillStyle = o.gate || '#4ad06a'; x.beginPath(); x.arc(px, top - 6, 3.5, 0, 7); x.fill(); x.restore(); }
    x.fillStyle = 'rgba(160,210,240,.55)'; x.fillRect(a + 8, top - 6, (b - a) / 2 - 12, 14); x.fillRect((a + b) / 2 + 4, top - 6, (b - a) / 2 - 12, 14); x.strokeStyle = INK; x.lineWidth = 1.5; x.strokeRect(a + 8, top - 6, (b - a) / 2 - 12, 14); x.strokeRect((a + b) / 2 + 4, top - 6, (b - a) / 2 - 12, 14);
  }
  txt(x, '刷工牌 →', 195, top, { font: KF, size: 11, color: 'rgba(42,36,64,.55)', align: 'center' });
  // 隔离带
  x.save(); x.strokeStyle = '#c0403a'; x.lineWidth = 3; for (const yy of [top + 36]) { x.beginPath(); x.moveTo(14, yy); x.quadraticCurveTo(100, yy + 8, 195, yy); x.quadraticCurveTo(290, yy + 8, 376, yy); x.stroke(); }
  x.fillStyle = '#ffd84a'; x.strokeStyle = INK; x.lineWidth = 1.5; for (const px of [14, 195, 376]) { x.beginPath(); x.arc(px, top + 36, 4.5, 0, 7); x.fill(); x.stroke(); } x.restore();
  x.save(); rr(x, 8, top + 46, 110, 20, 10); x.fillStyle = o.labCol || '#fff'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.restore();
  txt(x, o.label || '大堂排队', 63, top + 56, { font: KF, size: 11, color: o.labTc || INK, align: 'center' });
  people.forEach(p => p());
}
function closeBtn(x, col = '#ff7a4a', o = {}) {
  x.save(); rr(x, 110, 724, 170, 46, 23); x.fillStyle = 'rgba(30,30,60,.25)'; x.fill(); rr(x, 110, 718, 170, 46, 23); const g = x.createLinearGradient(0, 718, 0, 764); g.addColorStop(0, col); g.addColorStop(1, o.dark || '#d0502a'); x.fillStyle = g; x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.3)'; rr(x, 124, 722, 142, 12, 6); x.fill(); x.restore();
  txt(x, '▶◀ 关门出发', 195, 741, { font: KF, size: 18, color: '#fff', align: 'center', stroke: INK, sw: 3 });
  if (o.badge) { x.save(); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(272, 722, 13, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); x.restore(); txt(x, o.badge, 272, 723, { font: LF, size: 12, color: INK, align: 'center' }); }
}
export { W, H, KF, LF, INK, CELL, GY, SKIN, R, rnd, lobbyBg, banner, cabin, at, cellMark, worker, prop, tag, bubble, star, bolt, finger, hud, queue, closeBtn, plantPot };

