// 早高峰电梯：8:50→9:00，把大堂的同事拖进轿厢格子，按各自的脾气摆好，关门送上楼。
// 9:00 前送上去的人数达到"全勤目标"就进入第二天（人更多），成绩 = 连续全勤天数。
import { V, ctx, frameBegin, input, onResize, txt, rr, store, buzz, clamp, off } from './core.js';
import { unlock, A as AU } from './audio.js';
import { aseed, KF, LF, INK, CELL, GY, SKIN, lobbyBg, banner, cabin, cellMark, worker, prop, tag, bubble, star, bolt, finger, hud, queue, closeBtn } from './art.js';
import { M, startMusic, setStage, sfx } from './music.js';

const W = 390, DAY = 180, MIN = DAY / 10; // 现实 3 分钟 = 打卡钟 10 分钟
const ALL = { n: .45, box: .12, bike: .08, coffee: .12, feud: .12, couple: .11 };
const STAGES = [
  { at: 0, cols: 3, rows: 3, rate: .38, kinds: { n: 1 }, ban: '今天也要元气满满！', tip: '把同事拖进电梯格子 · 点「关门出发」送上楼' },
  { at: 2, cols: 4, rows: 3, rate: .48, kinds: { n: .5, box: .2, bike: .12, coffee: .18 }, ban: '带东西的来了', tip: '新：纸箱占 2 格 · 自行车占 L 形 · 咖啡四周留空', theme: { wall: '#dff2e6', ceil: '#c4dccc' } },
  { at: 4, cols: 4, rows: 4, rate: .58, kinds: ALL, ban: '冤家和情侣', tip: '新：⚡冤家不能挨着 · ♥情侣必须挨着才肯走', theme: { wall: '#fff2cc', ceil: '#eedcaa', sky: ['#ffd08a', '#fff0c8'] } },
  { at: 6, cols: 5, rows: 4, rate: .72, kinds: ALL, boss: true, ban: '老板驾到', tip: '新：老板周围一圈没人敢站 · 他必须坐这一趟', theme: { wall: '#f2dcd6', ceil: '#e0c4bc', sky: ['#ff9a6a', '#ffd8b0'], far: '#d8a090', near: '#a86a6a', lit: .5, floor0: '#f6e2d8', floor1: '#e8cfc2', wain: '#a8704a', pil0: '#e2c4bc', pil1: '#fbeae4' } },
  { at: 9, cols: 5, rows: 4, rate: .95, kinds: ALL, boss: true, auto: 5, alarm: true, ban: '8:59 冲刺！', tip: '最后一分钟：门开 5 秒就自己关', theme: { wall: '#f6ccc4', ceil: '#e8b0a6', sky: ['#ff8a5a', '#ffc8a0'], far: '#d88a7a', near: '#a85a5a', lit: .6, floor0: '#f6dcd2', floor1: '#e8c4b8', wain: '#a8603a', pil0: '#e8c0b8', pil1: '#fbe4dc' } },
];
const SHAPE = { n: [[0, 0]], coffee: [[0, 0]], boss: [[0, 0]], feud: [[0, 0]], couple: [[0, 0]], box: [[0, 0], [1, 0]], bike: [[0, 0], [1, 0], [0, 1]] };
const CEN = { box: [CELL / 2, 0], bike: [CELL / 2, CELL / 2] }; // 形状中心相对锚格中心
const TAG = { box: ['2 格', '#4a8a2a'], bike: ['L 形', '#e04a4a'], coffee: ['留空', '#e08a1a'], feud: ['冤家', '#7a4ac0'], couple: ['情侣', '#e05a8a'], boss: ['老板', '#2a2a3a'] };
const PAIRC = ['#e04a4a', '#4a8ae0', '#4ab04a', '#e0a03a', '#a05ad0'];
const SHIRTS = ['#5a8ae0', '#f08aa8', '#6ac08a', '#e0a03a', '#a87ae0', '#4ac0d0', '#e05a5a', '#c06aa0', '#4a80c0', '#f0c04a'];
const HAIRS = ['short', 'part', 'pony', 'bun', 'curly', 'buzz', 'long', 'bald'];
const HCOL = ['#3a2a20', '#1a1a1a', '#8a4a2a', '#c08a3a', '#5a3a2a'];
const pk = a => a[Math.floor(Math.random() * a.length)];

const G = window.__G = {};
const S = { sc: 1, ox: 0, LH: 780, dy: 0 };
let bgC = {}, cabC = {};
function layout() {
  S.sc = Math.min(1, V.H / 780); S.ox = (W - W * S.sc) / 2; S.LH = V.H / S.sc; S.dy = S.LH - 780;
  bgC = {}; cabC = {}; for (const p of allPeople()) p.spr = null;
}
onResize(layout);
const toG = (x, y) => [(x - S.ox) / S.sc, y / S.sc];
function allPeople() { return G.q ? [...G.q, ...G.cab.ps.map(e => e.p)] : []; }

// —— 一天 ——
function newDay(day) {
  Object.assign(G, {
    phase: 'run', day, t: 0, stage: 0, score: 0, target: 70 + (day - 1) * 8, mult: 1 + (day - 1) * .12,
    q: [], cab: { cols: 3, rows: 3, ps: [] }, el: 'open', elT: 0, trip: 1, autoT: 0, trips: 0, floor: 1, topFloor: 1,
    spawnAcc: 1.5, bossCd: 4, pairId: 0, nid: 0, drag: null, pops: [], msg: null, placedEver: G.placedEver || false,
    missed: 0, late: 0, resT: 0, happyTrips: 0, stageT: 0,
  });
  for (let i = 0; i < 3; i++) G.q.push(mk('n'));
  setStage(0); M.over = false;
}
function reset() { G.streak = 0; newDay(1); }
function mk(kind, pair) {
  const st = G.stage || 0, panic = st >= 3 || (st >= 2 && Math.random() < .3);
  const look = { shirt: pk(SHIRTS), hair: pk(HAIRS), hairCol: pk(HCOL), skin: pk(SKIN), face: panic ? 'panic' : pk(['ok', 'ok', 'happy', 'phone', 'yawn', 'sleepy']), sweat: panic, lan: pk(PAIRC) };
  if (Math.random() < .3) look.outfit = pk(['suit', 'hoodie']);
  if (Math.random() < .25) look.glasses = true;
  if (Math.random() < .2) look.bag = pk(['backpack', 'brief']);
  if (look.outfit === 'suit' && Math.random() < .6) look.tie = pk(PAIRC);
  if (kind === 'feud') { look.face = 'angry'; look.smoke = true; look.sweat = false; }
  if (kind === 'couple') { look.face = 'happy'; look.sweat = false; }
  if (kind === 'boss') Object.assign(look, { outfit: 'vest', vest: '#2a2a3a', tie: '#ffd84a', hair: 'bald', hairCol: '#5a4a3a', face: 'angry', glasses: true, s: 1.22, badge: false, sweat: false, bag: null });
  if (kind === 'coffee') look.phones = Math.random() < .5 ? '#e04a4a' : null;
  return { id: ++G.nid, kind, look, pair: pair || 0, spr: null };
}
function spawn() {
  const st = STAGES[G.stage];
  let tot = 0; for (const k in st.kinds) tot += st.kinds[k];
  let r = Math.random() * tot, kind = 'n'; for (const k in st.kinds) { r -= st.kinds[k]; if (r <= 0) { kind = k; break; } }
  const add = p => { if (G.q.length >= 16) { G.missed++; return; } G.q.push(p); };
  if (kind === 'feud' || kind === 'couple') { const id = ++G.pairId; add(mk(kind, id)); add(mk(kind, id)); }
  else add(mk(kind));
}

// —— 摆放规则 ——
const cellsOf = (p, c, r) => SHAPE[p.kind].map(([dc, dr]) => [c + dc, r + dr]);
const adj4 = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const near8 = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1;
function check(p, c, r) {
  const cs = cellsOf(p, c, r), cab = G.cab;
  for (const [cc, rr2] of cs) if (cc < 0 || rr2 < 0 || cc >= cab.cols || rr2 >= cab.rows) return { ok: false, why: '放不下', cs };
  for (const e of cab.ps) {
    const os = cellsOf(e.p, e.c, e.r);
    for (const a of cs) for (const b of os) {
      if (a[0] === b[0] && a[1] === b[1]) return { ok: false, why: '这里有人了', cs };
    }
    for (const a of cs) for (const b of os) {
      if ((p.kind === 'coffee' || e.p.kind === 'coffee') && adj4(a, b)) return { ok: false, why: '别挤！咖啡要洒了', cs };
      if (p.kind === 'feud' && e.p.kind === 'feud' && p.pair === e.p.pair && adj4(a, b)) return { ok: false, why: '哼！不跟他挨着', cs };
      if ((p.kind === 'boss' || e.p.kind === 'boss') && near8(a, b)) return { ok: false, why: '老板旁边……不敢站', cs };
    }
  }
  return { ok: true, cs };
}
function cabGx() { return (W - G.cab.cols * CELL) / 2; }
function anchorAt(p, x, y) {
  const [ox, oy] = CEN[p.kind] || [0, 0], gx = cabGx();
  return [Math.round((x - ox - gx - CELL / 2) / CELL), Math.round((y - oy - GY - CELL / 2) / CELL)];
}
function inCabin(x, y) { const gx = cabGx(); return x > gx - 20 && x < gx + G.cab.cols * CELL + 20 && y > GY - 20 && y < GY + G.cab.rows * CELL + 20; }

// —— 电梯 ——
function pop(s, x, y, col = '#4ab04a', size = 16) { G.pops.push({ s, x, y, t: 0, col, size }); }
function toast(s, col = '#e04a4a') { G.msg = { s, t: 1.8, col }; }
function closeDoor(auto) {
  if (G.el !== 'open' || G.phase !== 'run') return false;
  if (!auto && G.q.some(p => p.kind === 'boss') && !G.cab.ps.some(e => e.p.kind === 'boss')) { toast('老板还没上车！'); sfx.bad(); return false; }
  if (!G.cab.ps.length && !auto) { toast('先拖人进来'); sfx.bad(); return false; }
  if (G.drag) dropBack();
  // 情侣：另一半不在身边就不走
  const gx = cabGx(), out = [];
  for (const e of G.cab.ps) if (e.p.kind === 'couple') {
    const mate = G.cab.ps.find(o => o !== e && o.p.kind === 'couple' && o.p.pair === e.p.pair);
    if (!mate || !adj4([e.c, e.r], [mate.c, mate.r])) out.push(e);
  }
  for (const e of out) { G.cab.ps.splice(G.cab.ps.indexOf(e), 1); G.q.unshift(e.p); pop('要和TA一起！', gx + e.c * CELL + CELL / 2, GY + e.r * CELL, '#e05a8a', 14); }
  if (out.length) sfx.angry();
  const n = G.cab.ps.length, used = G.cab.ps.reduce((s, e) => s + SHAPE[e.p.kind].length, 0);
  G.score += n; G.trips++;
  let bonus = 0;
  if (n >= 3 && !out.length && used >= G.cab.cols * G.cab.rows * .7) { bonus = 3; G.score += 3; G.happyTrips++; }
  if (n) { sfx.score(); pop('+' + n + (bonus ? '  全员满意 +3' : ''), W / 2, GY - 24, bonus ? '#e0603a' : '#4ab04a', bonus ? 20 : 22); }
  G.el = 'closing'; G.elT = 0; G.trip = 4 + n * .25; G.topFloor = Math.min(23, 3 + n * 2 + Math.floor(Math.random() * 4)); sfx.close(); buzz(20);
  return true;
}
function updElevator(dt) {
  G.elT += dt;
  if (G.el === 'closing' && G.elT > .45) { G.el = 'away'; G.elT = 0; G.cab.ps = []; }
  else if (G.el === 'away') {
    const k = G.elT / G.trip; G.floor = Math.max(1, Math.round(k < .5 ? 1 + (G.topFloor - 1) * k * 2 : G.topFloor - (G.topFloor - 1) * (k - .5) * 2));
    if (k >= 1) { G.el = 'opening'; G.elT = 0; G.floor = 1; const st = STAGES[G.stage]; G.cab.cols = st.cols; G.cab.rows = st.rows; sfx.ding(); }
  } else if (G.el === 'opening' && G.elT > .45) { G.el = 'open'; G.elT = 0; G.autoT = STAGES[G.stage].auto || 0; }
  else if (G.el === 'open' && G.autoT > 0) { G.autoT -= dt; if (G.autoT <= 0) closeDoor(true); }
}

// —— 输入 ——
function slotX(i) { return 42 + i * 76.5; }
const SLOT_Y = 640;
function hitQueue(x, y) {
  if (Math.abs(y - (SLOT_Y + S.dy)) > 48) return -1;
  for (let i = 0; i < Math.min(5, G.q.length); i++) if (Math.abs(x - slotX(i)) < 38) return i;
  return -1;
}
function hitCab(x, y) {
  if (G.el !== 'open') return null;
  const gx = cabGx(), c = Math.floor((x - gx) / CELL), r = Math.floor((y - GY) / CELL);
  return G.cab.ps.find(e => cellsOf(e.p, e.c, e.r).some(([a, b]) => a === c && b === r)) || null;
}
function updDrag(x, y) {
  const d = G.drag; d.x = x; d.y = y;
  const py = y - 34; d.cell = null; d.res = null;
  if (G.el === 'open' && inCabin(x, py)) { d.cell = anchorAt(d.p, x, py); d.res = check(d.p, ...d.cell); }
}
function dropBack() {
  const d = G.drag; if (!d) return;
  if (d.from === 'cab' && G.el !== 'away') G.cab.ps.push(d.orig); else if (d.from === 'cab') G.q.unshift(d.p); else G.q.splice(Math.min(d.qi, G.q.length), 0, d.p);
  G.drag = null;
}
function onDown(x0, y0) {
  const [x, y] = toG(x0, y0);
  if (G.phase === 'result') { if (G.resT > 1.2) { if (G.won) newDay(G.day + 1); else reset(); } return; }
  if (x > 110 && x < 280 && y > 712 + S.dy && y < 770 + S.dy) { closeDoor(false); return; }
  const qi = hitQueue(x, y);
  if (qi >= 0) { const p = G.q.splice(qi, 1)[0]; G.drag = { p, from: 'q', qi }; sfx.pick(); updDrag(x, y); return; }
  const e = hitCab(x, y);
  if (e) { G.cab.ps.splice(G.cab.ps.indexOf(e), 1); G.drag = { p: e.p, from: 'cab', orig: e }; sfx.pick(); updDrag(x, y); }
}
function onMove(x0, y0) { if (G.drag) updDrag(...toG(x0, y0)); }
function onUp(x0, y0) {
  const d = G.drag; if (!d) return;
  updDrag(...toG(x0, y0));
  if (d.res && d.res.ok && G.el === 'open') {
    G.cab.ps.push({ p: d.p, c: d.cell[0], r: d.cell[1], t: 0 }); G.drag = null; G.placedEver = true; sfx.drop(); buzz(8);
    const gx = cabGx(); pop('✓', gx + d.cell[0] * CELL + CELL / 2, GY + d.cell[1] * CELL + 6, '#4ab04a', 18);
    return;
  }
  if (d.res && !d.res.ok) { sfx.bad(); pop(d.res.why, clamp(d.x, 80, 310), d.y - 80, '#e04a4a', 14); buzz(25); }
  if (d.from === 'cab' && !d.cell) { G.q.unshift(d.p); G.drag = null; return; } // 拖出轿厢 = 放回大堂
  dropBack();
}

// —— 更新 ——
function update(dt) {
  for (const p of G.pops) p.t += dt; G.pops = G.pops.filter(p => p.t < 1.3);
  if (G.msg && (G.msg.t -= dt) <= 0) G.msg = null;
  if (G.phase === 'result') { G.resT += dt; return; }
  G.t += dt; G.stageT += dt;
  const min = G.t / MIN;
  const ns = STAGES.reduce((a, s, i) => min >= s.at ? i : a, 0);
  if (ns !== G.stage) { G.stage = ns; G.stageT = 0; setStage(ns); sfx.stage(); toast(STAGES[ns].ban, '#e0603a'); }
  // 来人
  const st = STAGES[G.stage];
  G.spawnAcc += st.rate * G.mult * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc -= 1; spawn(); }
  if (st.boss) { G.bossCd -= dt; if (G.bossCd <= 0 && !allPeople().some(p => p.kind === 'boss') && !(G.drag && G.drag.p.kind === 'boss')) { G.q.unshift(mk('boss')); G.bossCd = 26; toast('老板来了！', '#2a2a3a'); sfx.angry(); } }
  updElevator(dt);
  if (G.t >= DAY) endDay();
}
function endDay() {
  if (G.drag) dropBack();
  G.late = G.q.length + G.cab.ps.length; G.phase = 'result'; G.resT = 0; M.over = true;
  G.won = G.score >= G.target;
  if (G.won) { G.streak++; sfx.ding(); } else sfx.angry();
  const bs = store.get('rushlift_best', { streak: 0, people: 0 });
  G.newBest = G.streak > bs.streak || G.score > bs.people;
  G.best = { streak: Math.max(bs.streak, G.streak), people: Math.max(bs.people, G.score) };
  store.set('rushlift_best', G.best);
}

// —— 绘制 ——
function spriteOf(p) {
  if (p.spr) return p.spr;
  const [c, x] = off(170, 160); x.translate(55, 62);
  const L = p.look;
  if (p.kind === 'box') { prop(x, 'box', CELL / 2, 10); worker(x, CELL / 2, -14, { ...L, s: .9 }); }
  else if (p.kind === 'bike') { prop(x, 'bike', CELL / 2, 6, { s: 1.1 }); worker(x, 0, CELL, L); }
  else if (p.kind === 'boss') {
    const g = x.createRadialGradient(0, 0, 8, 0, 0, 54); g.addColorStop(0, 'rgba(255,220,80,.7)'); g.addColorStop(1, 'rgba(255,220,80,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 54, 0, 7); x.fill();
    worker(x, 0, 0, L); prop(x, 'thermos', 24, 10); x.strokeStyle = '#ffd84a'; x.lineWidth = 3.5; x.beginPath(); x.ellipse(0, -40, 14, 5, 0, 0, 7); x.stroke();
  } else { worker(x, 0, 0, L); if (p.kind === 'coffee') prop(x, 'coffee', 18, 6); }
  return (p.spr = c);
}
function drawPerson(p, cx, cy, s = 1, a = 1) {
  const sp = spriteOf(p); ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(s, s); ctx.drawImage(sp, -55, -62, 170, 160); ctx.restore();
}
function badge(p, cx, cy) {
  if (p.kind === 'feud') { ctx.fillStyle = PAIRC[p.pair % 5]; ctx.beginPath(); ctx.arc(cx + 16, cy - 30, 9, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); bolt(ctx, cx + 16, cy - 30, .5); }
  if (p.kind === 'couple') { ctx.fillStyle = PAIRC[p.pair % 5]; ctx.beginPath(); ctx.arc(cx + 16, cy - 30, 9, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); txt(ctx, '♥', cx + 16, cy - 29, { size: 12, color: '#fff', align: 'center' }); }
}
function bgImg(st) {
  const k = G.stage; if (bgC[k]) return bgC[k];
  const [c, x] = off(W, 780); aseed(31 + k); lobbyBg(x, { theme: st.theme, alarm: st.alarm, punch: '08:5' + st.at }); return (bgC[k] = c);
}
function cabImg(st) {
  const k = G.cab.cols + 'x' + G.cab.rows + '_' + G.stage; if (cabC[k]) return cabC[k];
  const [c, x] = off(W, 560); aseed(5); cabin(x, G.cab.cols, G.cab.rows, { door: 0, floor: st.theme && st.theme.floor0, lit: [2, 5, 7] }); return (cabC[k] = c);
}
function drawDoors() {
  if (G.el === 'open') return;
  const gx = cabGx(), w = G.cab.cols * CELL, h = G.cab.rows * CELL;
  const k = G.el === 'closing' ? Math.min(1, G.elT / .45) : G.el === 'opening' ? 1 - Math.min(1, G.elT / .45) : 1;
  const half = (w + 8) / 2 * k, top = GY - 6, bh = h + 22;
  for (const [x0, dir] of [[gx - 4, 1], [gx + w + 4, -1]]) {
    const xa = dir > 0 ? x0 : x0 - half;
    const g = ctx.createLinearGradient(xa, 0, xa + half, 0); g.addColorStop(0, '#9aa3b8'); g.addColorStop(.5, '#eef2f8'); g.addColorStop(1, '#aab2c4');
    ctx.fillStyle = g; ctx.fillRect(xa, top, half, bh); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(xa, top, half, bh);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; for (let yy = top + 6; yy < top + bh; yy += 6) { ctx.beginPath(); ctx.moveTo(xa + 3, yy); ctx.lineTo(xa + half - 3, yy); ctx.stroke(); }
  }
  if (G.el === 'away' || k > .9) {
    const cx = W / 2, cy = GY + h / 2;
    rr(ctx, cx - 50, cy - 30, 100, 60, 10); ctx.fillStyle = '#14141c'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    const up = G.el === 'away' && G.elT / G.trip < .5;
    txt(ctx, G.floor + 'F', cx - 6, cy + 2, { font: LF, size: 30, color: '#ff6a3a', align: 'center', shadow: '#ff6a3a', blur: 10 });
    txt(ctx, up ? '▲' : '▼', cx + 34, cy, { size: 14, color: '#ff6a3a', align: 'center' });
    txt(ctx, G.el === 'away' ? (up ? '送人上楼…' : '回来接人…') : '', cx, cy + 46, { font: KF, size: 13, color: INK, align: 'center', stroke: '#fff', sw: 4 });
  }
}
function drawCabin(st) {
  ctx.drawImage(cabImg(st), 0, 0, W, 560);
  const gx = cabGx();
  if (!(G.stageT < 8 && G.phase === 'run')) txt(ctx, `容量 ${G.cab.cols}×${G.cab.rows}`, W / 2, 222, { font: KF, size: 11, color: 'rgba(42,36,64,.6)', align: 'center' });
  // 拖动时：禁区 + 目标格
  const d = G.drag;
  if (d && G.el === 'open') {
    for (const e of G.cab.ps) {
      if (e.p.kind === 'coffee') for (const [dc, dr] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) { const c = e.c + dc, r = e.r + dr; if (c >= 0 && r >= 0 && c < G.cab.cols && r < G.cab.rows) cellMark(ctx, gx, c, r, '#ffb03a', { a: .22, dash: true }); }
      if (e.p.kind === 'boss') for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) { const c = e.c + dc, r = e.r + dr; if ((dc || dr) && c >= 0 && r >= 0 && c < G.cab.cols && r < G.cab.rows) cellMark(ctx, gx, c, r, '#e04a4a', { a: .16, dash: true }); }
      if (d.p.kind === 'feud' && e.p.kind === 'feud' && e.p.pair === d.p.pair) for (const [dc, dr] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) { const c = e.c + dc, r = e.r + dr; if (c >= 0 && r >= 0 && c < G.cab.cols && r < G.cab.rows) cellMark(ctx, gx, c, r, '#7a4ac0', { a: .2, dash: true }); }
    }
    if (d.res) for (const [c, r] of d.res.cs) if (c >= 0 && r >= 0 && c < G.cab.cols && r < G.cab.rows) cellMark(ctx, gx, c, r, d.res.ok ? '#4ab04a' : '#e04a4a', { a: .5, dash: true });
  }
  if (G.el !== 'away') {
    const list = [...G.cab.ps].sort((a, b) => a.r - b.r);
    for (const e of list) {
      e.t = (e.t || 0) + 1 / 60; const bounce = e.t < .25 ? Math.sin(e.t / .25 * Math.PI) * 6 : 0;
      const cx = gx + e.c * CELL + CELL / 2, cy = GY + e.r * CELL + CELL / 2 - bounce;
      drawPerson(e.p, cx, cy); badge(e.p, cx, cy);
      if (e.p.kind === 'boss') tag(ctx, cx, cy - 56, '老板', '#2a2a3a', '#ffd84a');
      if (e.p.kind === 'couple') { const mate = G.cab.ps.find(o => o !== e && o.p.kind === 'couple' && o.p.pair === e.p.pair); if (!mate || !adj4([e.c, e.r], [mate.c, mate.r])) txt(ctx, '?', cx - 16, cy - 30, { font: LF, size: 16, color: '#e05a8a', align: 'center', stroke: '#fff', sw: 3 }); }
    }
  }
  drawDoors();
  // 末段：自动关门倒计时
  if (G.el === 'open' && G.autoT > 0) { const w = G.cab.cols * CELL; ctx.fillStyle = 'rgba(42,36,64,.25)'; rr(ctx, gx, GY + G.cab.rows * CELL + 22, w, 8, 4); ctx.fill(); ctx.fillStyle = '#e04a4a'; rr(ctx, gx, GY + G.cab.rows * CELL + 22, w * G.autoT / STAGES[G.stage].auto, 8, 4); ctx.fill(); }
}
function drawQueue() {
  ctx.save(); ctx.translate(0, S.dy);
  queue(ctx, 530, [], { label: `大堂排队 · ${G.q.length} 人`, labCol: G.q.length > 10 ? '#e04a4a' : '#fff', labTc: G.q.length > 10 ? '#fff' : INK, gate: G.stage >= 3 ? '#ff4a3a' : '#4ad06a' });
  const n = Math.min(5, G.q.length);
  for (let i = n - 1; i >= 0; i--) {
    const p = G.q[i], [ox, oy] = CEN[p.kind] || [0, 0], s = p.kind === 'bike' ? .62 : p.kind === 'box' ? .72 : .85;
    const cx = slotX(i), cy = SLOT_Y + Math.sin(G.t * 3 + i) * (G.stage >= 3 ? 2 : .8);
    drawPerson(p, cx - ox * s, cy - oy * s, s); badge(p, cx, cy);
    if (TAG[p.kind]) tag(ctx, cx, SLOT_Y + 46, TAG[p.kind][0], TAG[p.kind][1], p.kind === 'boss' ? '#ffd84a' : '#fff');
  }
  if (G.q.length > 5) txt(ctx, '+' + (G.q.length - 5), 372, 584, { font: LF, size: 16, color: INK, align: 'center', stroke: '#fff', sw: 4 });
  const can = G.el === 'open';
  ctx.globalAlpha = can ? 1 : .55;
  closeBtn(ctx, G.stage >= 3 ? '#ff4a3a' : '#ff7a4a', { dark: G.stage >= 3 ? '#b8281c' : '#d0502a', badge: G.cab.ps.length ? String(G.cab.ps.length) : null });
  ctx.globalAlpha = 1;
  ctx.restore();
}
function tutorial() {
  if (G.phase !== 'run' || G.drag) return;
  if (!G.placedEver && G.q.length && G.el === 'open') {
    const k = (G.t * .7) % 1, gx = cabGx(), tx = gx + CELL * 1.5, ty = GY + CELL * 1.5;
    const sx = slotX(0), sy = SLOT_Y + S.dy, e = k < .7 ? k / .7 : 1;
    ctx.save(); ctx.strokeStyle = 'rgba(74,176,74,.7)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx, ty + 40, tx, ty + 18); ctx.stroke(); ctx.restore();
    const fx = sx + (tx - sx) * e, fy = sy + (ty - sy) * e;
    finger(ctx, fx - 4, fy + 14);
    bubble(ctx, W / 2 + 60, 470, '按住同事 → 拖进电梯', '#fff', INK, 15);
  } else if (G.trips === 0 && G.cab.ps.length >= 3 && G.el === 'open') {
    const b = Math.sin(G.t * 8) * 4; bubble(ctx, W / 2, 686 + S.dy + b, '装好了就点这里！', '#ffd84a', INK, 15);
  }
}
function drawResult() {
  if (G.phase !== 'result') return;
  const a = Math.min(1, G.resT * 3), cy = S.LH * .45;
  ctx.globalAlpha = a * .5; ctx.fillStyle = '#1a1830'; ctx.fillRect(0, 0, W, S.LH); ctx.globalAlpha = a;
  rr(ctx, 34, cy - 170, 322, 330, 22); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
  rr(ctx, 34, cy - 170, 322, 56, { upperLeft: 22, upperRight: 22, lowerLeft: 0, lowerRight: 0 }); ctx.fillStyle = G.won ? '#4ab04a' : '#e0603a'; ctx.fill(); ctx.stroke();
  txt(ctx, `第 ${G.day} 天 · 9:00 打卡结束`, W / 2, cy - 142, { font: KF, size: 20, color: '#fff', align: 'center', stroke: INK, sw: 3 });
  txt(ctx, String(G.score), W / 2, cy - 72, { font: LF, size: 60, color: INK, align: 'center' });
  txt(ctx, `准点打卡 / 目标 ${G.target} 人`, W / 2, cy - 28, { font: KF, size: 15, color: INK, align: 'center' });
  if (G.won) { star(ctx, 92, cy - 72, 18); star(ctx, 298, cy - 72, 18); }
  txt(ctx, G.won ? '全勤达成！明天人更多' : '没达到全勤目标', W / 2, cy + 8, { font: KF, size: 18, color: G.won ? '#4ab04a' : '#e04a4a', align: 'center' });
  txt(ctx, `连续全勤 ${G.streak} 天 · 最高 ${G.best.streak} 天`, W / 2, cy + 40, { font: KF, size: 14, color: INK, align: 'center' });
  txt(ctx, `送了 ${G.trips} 趟 · 全员满意 ${G.happyTrips} 趟 · 迟到 ${G.late + G.missed} 人`, W / 2, cy + 66, { font: KF, size: 13, color: 'rgba(42,36,64,.7)', align: 'center' });
  if (G.newBest) txt(ctx, '新纪录！', W / 2, cy + 94, { font: KF, size: 16, color: '#e0603a', align: 'center' });
  if (G.resT > 1.2) txt(ctx, G.won ? '轻触 · 第二天上班' : '轻触 · 重新开始第一天', W / 2, cy + 132, { font: KF, size: 17, color: '#e0603a', align: 'center', alpha: a * (.6 + .4 * Math.sin(G.resT * 5)) });
  ctx.globalAlpha = 1;
}
function render() {
  const st = STAGES[G.stage];
  frameBegin('#1a1830');
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, V.H); ctx.clip();
  ctx.translate(S.ox, 0); ctx.scale(S.sc, S.sc);
  const t = st.theme || {};
  ctx.fillStyle = t.floor1 || '#e2d8ca'; ctx.fillRect(0, 700, W, S.LH - 700);
  ctx.drawImage(bgImg(st), 0, 0, W, 780);
  if (S.dy > 0) { ctx.fillStyle = t.floor1 || '#e2d8ca'; ctx.fillRect(0, 780, W, S.dy); }
  banner(ctx, st.ban, G.stage >= 3 ? '#e04a4a' : '#e0603a');
  // 段落提示
  if (G.stageT < 8 && G.phase === 'run') { ctx.save(); ctx.font = `12px ${KF}`; const w = ctx.measureText(st.tip).width + 24; ctx.restore(); rr(ctx, W / 2 - w / 2, 199, w, 20, 10); ctx.fillStyle = 'rgba(42,36,64,.82)'; ctx.fill(); txt(ctx, st.tip, W / 2, 209, { font: KF, size: 12, color: '#fff', align: 'center' }); }
  drawCabin(st);
  drawQueue();
  // 拖着的人
  const d = G.drag;
  if (d) { const [ox, oy] = CEN[d.p.kind] || [0, 0]; drawPerson(d.p, d.x - ox, d.y - 34 - oy, 1.1); badge(d.p, d.x - ox, d.y - 34 - oy); }
  // 挂钟 HUD
  const min = Math.min(10, G.t / MIN), last = G.t >= 9 * MIN;
  hud(ctx, { floor: G.el === 'away' ? G.floor + 'F' : '1F', min: 50 + min, minTxt: last ? '8:59:' + String(Math.min(59, Math.floor((G.t - 9 * MIN) / MIN * 60))).padStart(2, '0') : null, score: G.score + ' 人', ding: G.el === 'opening' || (G.el === 'open' && G.elT < .8 && G.trips > 0), redZone: min >= 8 ? (min - 8) / 60 * 6.283 * 2 + .2 : 0 });
  txt(ctx, `目标 ${G.target}`, 330, 82, { font: KF, size: 12, color: G.score >= G.target ? '#4ab04a' : '#e0603a', align: 'center', stroke: '#fff', sw: 3 });
  txt(ctx, `第 ${G.day} 天`, 78, 84, { font: KF, size: 12, color: INK, align: 'center', stroke: '#fff', sw: 3 });
  // 飘字
  for (const p of G.pops) txt(ctx, p.s, p.x, p.y - p.t * 40, { font: KF, size: p.size, color: p.col, align: 'center', stroke: '#fff', sw: 4, alpha: Math.min(1, (1.3 - p.t) * 3) });
  if (G.msg) bubble(ctx, W / 2, 168, G.msg.s, G.msg.col, '#fff', 16);
  tutorial();
  // 最后一分钟：边缘红光
  if (last && G.phase === 'run') { const k = .25 + .15 * Math.sin(G.t * 9); const v = ctx.createRadialGradient(W / 2, S.LH / 2, 200, W / 2, S.LH / 2, S.LH * .62); v.addColorStop(0, 'rgba(255,40,30,0)'); v.addColorStop(1, `rgba(255,40,30,${k})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, S.LH); }
  drawResult();
  ctx.restore();
}

let lastTs = 0;
function loop(ts) {
  const dt = Math.min(1 / 30, lastTs ? (ts - lastTs) / 1000 : 0); lastTs = ts;
  update(dt * (G.ts || 1)); render(); requestAnimationFrame(loop);
}
export function boot() {
  layout(); reset();
  input.first.push(() => { unlock(); startMusic(); });
  input.down = onDown; input.move = onMove; input.up = onUp;
  Object.assign(G, {
    S, check, closeDoor, restart: reset, audio: AU, slotX, SLOT_Y, cabGx, CELL, GY,
    skipTo(min) { G.t = min * MIN; G.spawnAcc = 0; },
    // 测试/调参用：把队首的人自动塞进第一个合法位置
    autoPlace() {
      if (G.el !== 'open') return false;
      for (let i = 0; i < Math.min(5, G.q.length); i++) {
        const p = G.q[i];
        for (let r = 0; r < G.cab.rows; r++) for (let c = 0; c < G.cab.cols; c++) if (check(p, c, r).ok) { G.q.splice(i, 1); G.cab.ps.push({ p, c, r, t: 0 }); G.placedEver = true; return true; }
      }
      return false;
    },
  });
  requestAnimationFrame(loop);
}
