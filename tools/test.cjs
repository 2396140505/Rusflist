// 触屏回归测试：node tools/test.cjs → images/test_*.png，最后打印 PASS/FAIL
const path = require('path'), fs = require('fs');
const launch = require('./edge.cjs');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'images');
fs.mkdirSync(OUT, { recursive: true });
const fails = [], ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.emulate({ viewport: { width: 390, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' });
  await p.goto('file:///' + path.join(ROOT, 'dist/index.html').replace(/\\/g, '/'));
  await p.waitForFunction(() => window.__G && window.__G.phase, { timeout: 8000 });
  const G = f => p.evaluate(f);
  // 游戏坐标 → 屏幕坐标
  const scr = (gx, gy) => p.evaluate((gx, gy) => { const w = innerWidth, h = innerHeight, k = Math.min(w / 390, h / 640), H = Math.min(900, h / k), S = __G.S; const lx = gx * S.sc + S.ox, ly = gy * S.sc; return [(w - 390 * k) / 2 + lx * k, (h - H * k) / 2 + ly * k]; }, gx, gy);
  const drag = async (a, bb) => { const [x0, y0] = await scr(...a), [x1, y1] = await scr(...bb); await p.touchscreen.touchStart(x0, y0); for (let i = 1; i <= 8; i++) { await p.touchscreen.touchMove(x0 + (x1 - x0) * i / 8, y0 + (y1 - y0) * i / 8); await wait(16); } await p.touchscreen.touchEnd(); };
  const tap = async (gx, gy) => { const [x, y] = await scr(gx, gy); await p.touchscreen.tap(x, y); };
  const cellPt = (c, r) => p.evaluate((c, r) => [__G.cabGx() + c * __G.CELL + __G.CELL / 2, __G.GY + r * __G.CELL + __G.CELL / 2 + 34], c, r);
  const slotPt = i => p.evaluate(i => [__G.slotX(i), __G.SLOT_Y + __G.S.dy], i);
  const closePt = () => p.evaluate(() => [195, 741 + __G.S.dy]);

  ok(await G(() => __G.phase === 'run'), '打开即开局（无封面）');
  await wait(1000);
  ok(await G(() => __G.t > .5), '打卡钟在走');
  await p.screenshot({ path: path.join(OUT, 'test_1_start.png') });
  // 拖第一个同事进 (1,1)
  await drag(await slotPt(0), await cellPt(1, 1)); await wait(100);
  ok(await G(() => __G.cab.ps.length === 1 && __G.cab.ps[0].c === 1 && __G.cab.ps[0].r === 1), '拖动同事进轿厢格子');
  ok(await G(() => __G.audio.ac !== null), '首次触摸后音频已解锁');
  await drag(await slotPt(0), await cellPt(0, 0)); await drag(await slotPt(0), await cellPt(2, 2)); await wait(100);
  await p.screenshot({ path: path.join(OUT, 'test_2_placed.png') });
  // 占用的格子不能放
  await G(() => { __G.q.unshift({ id: 999, kind: 'n', look: { shirt: '#5a8ae0' }, pair: 0 }); });
  await drag(await slotPt(0), await cellPt(1, 1)); await wait(100);
  ok(await G(() => __G.q[0].id === 999 && __G.cab.ps.length === 3), '有人的格子放不进去，人回到队首');
  // 关门送人
  const n0 = await G(() => __G.score);
  await tap(...await closePt()); await wait(200);
  ok(await G(() => __G.el === 'closing' || __G.el === 'away'), '点关门出发');
  ok(await G(() => __G.score) === n0 + 3, '送走 3 人计分');
  await wait(300); await p.screenshot({ path: path.join(OUT, 'test_3_away.png') });
  await p.waitForFunction(() => __G.el === 'open', { timeout: 8000 });
  ok(true, '电梯回来开门');
  // 规则：咖啡四周留空、老板 8 格、冤家、情侣
  await G(() => { __G.skipTo(6.2); });
  await p.waitForFunction(() => __G.stage === 3, { timeout: 3000 });
  await G(() => { __G.cab.ps = []; __G.cab.cols = 5; __G.cab.rows = 4; __G.el = 'open'; });
  const rules = await G(() => {
    const mk = (kind, pair = 0) => ({ id: Math.random(), kind, look: { shirt: '#5a8ae0' }, pair });
    const out = {};
    __G.cab.ps = [{ p: mk('coffee'), c: 0, r: 0 }];
    out.coffee = !__G.check(mk('n'), 1, 0).ok && __G.check(mk('n'), 1, 1).ok;
    __G.cab.ps = [{ p: mk('boss'), c: 2, r: 1 }];
    out.boss = !__G.check(mk('n'), 3, 2).ok && __G.check(mk('n'), 4, 2).ok;
    __G.cab.ps = [{ p: mk('feud', 7), c: 0, r: 0 }];
    out.feud = !__G.check(mk('feud', 7), 0, 1).ok && __G.check(mk('feud', 8), 0, 1).ok;
    __G.cab.ps = [];
    out.box = __G.check(mk('box'), 3, 0).ok && !__G.check(mk('box'), 4, 0).ok;
    out.bike = __G.check(mk('bike'), 0, 2).ok && !__G.check(mk('bike'), 0, 3).ok;
    return out;
  });
  ok(rules.coffee, '咖啡四周必须空着'); ok(rules.boss, '老板周围 8 格没人'); ok(rules.feud, '冤家不能挨着');
  ok(rules.box && rules.bike, '纸箱 2 格 / 自行车 L 形 越界判定');
  // 情侣不挨着 → 不肯走
  const cp = await G(() => {
    const mk = (kind, pair = 0) => ({ id: Math.random(), kind, look: { shirt: '#5a8ae0' }, pair });
    __G.q = __G.q.filter(p => p.kind !== 'boss');
    __G.cab.ps = [{ p: mk('couple', 9), c: 0, r: 0 }, { p: mk('couple', 9), c: 4, r: 3 }, { p: mk('n'), c: 2, r: 2 }];
    const s0 = __G.score; __G.closeDoor(false); return __G.score - s0;
  });
  ok(cp === 1, '情侣没挨着就下车，只算 1 人 (' + cp + ')');
  await p.waitForFunction(() => __G.el === 'open', { timeout: 8000 });
  // 老板在队里不能关门
  await G(() => { __G.q.unshift({ id: 1234, kind: 'boss', look: { shirt: '#2a2a3a' }, pair: 0 }); __G.cab.ps = []; });
  const blocked = await G(() => !__G.closeDoor(false) && __G.msg.s.includes('老板'));
  ok(blocked, '老板没上车不能关门');
  await G(() => { __G.q = __G.q.filter(p => p.kind !== 'boss'); });
  // 画面截图：老板段
  await G(() => { for (let i = 0; i < 6; i++) __G.autoPlace(); });
  await wait(300); await p.screenshot({ path: path.join(OUT, 'test_4_boss.png') });
  // 机器人玩一整天（4 倍速）：校验难度可达
  await G(() => { __G.restart(); __G.ts = 4; __G.bot = setInterval(() => { if (__G.phase !== 'run') return; if (__G.el !== 'open') return; let k = 0; while (__G.autoPlace() && k < 20) k++; const cap = __G.cab.cols * __G.cab.rows, used = __G.cab.ps.reduce((s, e) => s + ({ box: 2, bike: 3 }[e.p.kind] || 1), 0); if (__G.cab.ps.length && (used >= cap * .6 || !k)) __G.closeDoor(false); }, 250); });
  await wait(20000); await p.screenshot({ path: path.join(OUT, 'test_5_rush.png') });
  await p.waitForFunction(() => __G.phase === 'result', { timeout: 60000 });
  const res = await G(() => { clearInterval(__G.bot); __G.ts = 1; return { score: __G.score, target: __G.target, trips: __G.trips, late: __G.late + __G.missed }; });
  console.log('     机器人一天：', JSON.stringify(res));
  ok(res.score >= res.target, '机器人能达成第 1 天全勤目标');
  await wait(1500); await p.screenshot({ path: path.join(OUT, 'test_6_result.png') });
  await tap(195, 400); await wait(100);
  ok(await G(() => __G.phase === 'run' && __G.t < 1), '结算后轻触进入下一天/重开');
  // 桌面宽屏
  await p.emulate({ viewport: { width: 1920, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0)' });
  await wait(600); await p.screenshot({ path: path.join(OUT, 'test_7_desktop.png') });
  ok(errs.length === 0, '无脚本错误 ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
