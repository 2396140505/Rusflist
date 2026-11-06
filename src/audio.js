// WebAudio 程序化音乐/音效：首次触摸解锁；16 分步进调度器 + 几种合成乐器
export const A = { ac: null, out: null, rev: null, on: false, bpm: 90, stepsPerBeat: 4, step: 0, next: 0, song: null, muted: false };
export function unlock() {
  if (A.ac) { if (A.ac.state !== 'running') A.ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ac = A.ac = new AC();
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
  A.out = ac.createGain(); A.out.gain.value = .8; A.out.connect(comp);
  // 程序生成的混响冲激
  const len = ac.sampleRate * 2.2, buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const cv = ac.createConvolver(); cv.buffer = buf; A.rev = ac.createGain(); A.rev.gain.value = .32; A.rev.connect(cv); cv.connect(A.out);
  A.noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const nd = A.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  A.on = true; A.next = ac.currentTime + .08;
  setInterval(tick, 25);
  document.addEventListener('visibilitychange', () => { if (document.hidden) ac.suspend(); else if (!A.hold) ac.resume(); });
}
function tick() {
  const ac = A.ac; if (!ac || ac.state !== 'running') { if (ac) A.next = ac.currentTime + .05; return; }
  while (A.next < ac.currentTime + .12) {
    if (A.song) A.song(A.step, A.next);
    A.step++; A.next += 60 / A.bpm / A.stepsPerBeat;
  }
}
export const now = () => A.ac ? A.ac.currentTime : 0;
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// 基础音：振荡器 + 包络 (+ 可选低通)
export function tone(f, t, dur, o = {}) {
  const ac = A.ac; if (!ac) return;
  const g = ac.createGain(), v = (o.vol ?? .2);
  const atk = o.atk ?? .005, rel = o.rel ?? dur;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + atk);
  if (o.sus) g.gain.setValueAtTime(v, t + dur); g.gain.exponentialRampToValueAtTime(.0001, t + (o.sus ? dur + rel : rel));
  let node = g;
  if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; f2.Q.value = o.q || .7; if (o.lpEnv) { f2.frequency.setValueAtTime(o.lp * o.lpEnv, t); f2.frequency.exponentialRampToValueAtTime(o.lp, t + (o.lpT || .2)); } g.connect(f2); node = f2; }
  node.connect(o.dest || A.out); if (o.wet) { const w = ac.createGain(); w.gain.value = o.wet; node.connect(w); w.connect(A.rev); }
  const end = t + (o.sus ? dur + rel : rel) + .05;
  for (const d of (o.det || [0])) {
    const os = ac.createOscillator(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t); os.detune.value = d;
    if (o.glide) os.frequency.exponentialRampToValueAtTime(o.glide, t + (o.glideT || dur));
    os.connect(g); os.start(t); os.stop(end);
  }
}
// 噪声打击（军鼓/镲/刷/沙沙）
export function noise(t, dur, o = {}) {
  const ac = A.ac; if (!ac) return;
  const s = ac.createBufferSource(); s.buffer = A.noise; s.playbackRate.value = o.rate || 1;
  const f = ac.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.value = o.f || 3000; f.Q.value = o.q || 1;
  if (o.fEnd) f.frequency.exponentialRampToValueAtTime(o.fEnd, t + dur);
  const g = ac.createGain(); const v = o.vol ?? .2;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (o.atk || .002)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(o.dest || A.out); if (o.wet) { const w = ac.createGain(); w.gain.value = o.wet; g.connect(w); w.connect(A.rev); }
  s.start(t, Math.random() * .5); s.stop(t + dur + .05);
}
export function kick(t, v = .7, f0 = 140, f1 = 42) { tone(f0, t, .3, { vol: v, glide: f1, glideT: .12, rel: .32, type: 'sine' }); }
export function snare(t, v = .3) { noise(t, .18, { vol: v, f: 1800, q: .6, ft: 'highpass' }); tone(190, t, .1, { vol: v * .5, type: 'triangle', rel: .1 }); }
export function hat(t, v = .08, open = false) { noise(t, open ? .25 : .05, { vol: v, f: 8000, ft: 'highpass', q: .5 }); }
