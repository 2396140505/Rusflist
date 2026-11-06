// 早高峰电梯 配乐：电梯爵士（行走低音 + 电钢琴 + 刷子鼓）→ 老板进场换成紧张弦乐 → 最后两分钟加钟摆滴答和心跳
import { A, tone, noise, kick, snare, hat, mtof } from './audio.js';

export const M = { stage: 0, over: false, late: 0 };
const JAZZ = [[50, [0, 3, 7, 10]], [55, [0, 4, 7, 10]], [48, [0, 4, 7, 11]], [57, [0, 4, 7, 10]]]; // Dm7 G7 Cmaj7 A7
const TENSE = [[45, [0, 3, 7]], [41, [0, 4, 7]], [40, [0, 4, 7]], [45, [0, 3, 7]]];             // Am F E Am
const WALK = [0, 3, 7, 10, 12, 10, 7, 5];
const MEL = [12, -1, 15, -1, 14, 12, -1, 10, -1, -1, 12, -1, 7, -1, -1, -1];

function song(step, t) {
  if (M.over) return;
  const st = M.stage, bar = Math.floor(step / 16), s = step % 16, sp = 60 / A.bpm / 4;
  const tense = st >= 3, [root, iv] = (tense ? TENSE : JAZZ)[bar % 4], chord = iv.map(i => root + i);
  if (!tense) {
    // 行走低音：每拍一个音
    if (s % 4 === 0) tone(mtof(root - 12 + WALK[(s / 4 + (bar % 2) * 4) % 8]), t, sp * 3.2, { type: 'triangle', vol: .13, rel: .2, lp: 700 });
    // 电钢琴：2、4 拍反拍
    if (s === 6 || s === 14) for (const m of chord) tone(mtof(m + 12), t, sp * 2, { type: 'sine', vol: .03, atk: .005, rel: .4, det: [-4, 4], wet: .35 });
    // 刷子：摇摆八分
    if (s % 4 === 0) noise(t, .12, { vol: .04, f: 3000, ft: 'highpass' });
    if (s % 4 === 3) noise(t, .06, { vol: .03, f: 5000, ft: 'highpass' });
    if (st >= 1 && (s === 4 || s === 12)) snare(t, .05);
    if (st >= 2 && bar % 2 === 1 && MEL[s] >= 0) tone(mtof(62 + MEL[s]), t, sp * 1.8, { type: 'triangle', vol: .045, rel: .3, wet: .4 });
    if (st >= 2 && s === 0) kick(t, .25, 90, 45);
  } else {
    // 弦乐：持续和弦 + 十六分顿弓
    if (s === 0) for (const m of chord) tone(mtof(m + 12), t, sp * 15.5, { type: 'sawtooth', vol: .018, atk: .25, sus: 1, rel: .4, lp: 1600, det: [-8, 8], wet: .4 });
    if (s % 2 === 0) tone(mtof(root + (s % 8 < 4 ? 0 : 7)), t, sp * .8, { type: 'sawtooth', vol: .035, rel: .08, lp: 1100 });
    if (s === 0 || s === 8) kick(t, .45, 100, 40);
    if (s === 4 || s === 12) snare(t, .1);
    hat(t, s % 2 ? .02 : .04);
    if (st >= 4) { // 钟摆 + 心跳
      if (s % 4 === 0) tone(s % 8 ? 1800 : 2400, t, .03, { type: 'square', vol: .03, rel: .03 });
      if (s === 0 || s === 3) kick(t, .5, 70, 36);
      if (bar % 2 === 1 && s >= 8 && s % 2 === 0) tone(mtof(chord[2] + 24), t, sp, { type: 'square', vol: .02, rel: .1, lp: 3000 });
    }
  }
}
export function startMusic() { A.song = song; }
export function setStage(i) { M.stage = i; A.bpm = [96, 104, 112, 122, 140][i]; }

const T0 = () => A.ac ? A.ac.currentTime + .01 : 0;
export const sfx = {
  pick() { tone(660, T0(), .08, { type: 'sine', vol: .07, glide: 880, rel: .08 }); },
  drop() { const t = T0(); tone(520, t, .1, { type: 'triangle', vol: .08, rel: .1 }); tone(780, t + .05, .12, { type: 'triangle', vol: .06, rel: .12 }); },
  bad() { tone(160, T0(), .16, { type: 'square', vol: .05, rel: .14, lp: 800 }); },
  close() { const t = T0(); noise(t, .45, { vol: .08, f: 900, q: 1.2 }); tone(220, t + .4, .1, { type: 'triangle', vol: .08, rel: .1 }); },
  ding() { const t = T0(); tone(1318, t, .8, { type: 'sine', vol: .08, rel: .8 }); tone(1046, t + .18, 1, { type: 'sine', vol: .07, rel: 1 }); },
  score() { const t = T0(); for (const [i, m] of [72, 76, 79, 84].entries()) tone(mtof(m), t + i * .06, .2, { type: 'square', vol: .03, rel: .2, lp: 3000 }); },
  angry() { const t = T0(); tone(140, t, .3, { type: 'sawtooth', vol: .06, glide: 90, rel: .3, lp: 900 }); },
  stage() { const t = T0(); for (const [i, m] of [67, 72, 76].entries()) tone(mtof(m), t + i * .1, .3, { type: 'triangle', vol: .07, rel: .3 }); },
  tick() { tone(2000, T0(), .02, { type: 'square', vol: .03, rel: .02 }); },
};
