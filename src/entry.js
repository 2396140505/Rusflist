import { boot } from './game.js';
// 字体内联为 data URL，等加载完再开局，避免首帧回退字体
Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(() => Promise.all(["Kuaile", "Lilita"].map(f => document.fonts.load('20px ' + f).catch(() => 0)))).then(boot);
