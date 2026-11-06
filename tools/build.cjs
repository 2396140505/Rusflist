// 用法: node tools/build.cjs —— esbuild 打包 src/entry.js，字体按源码用字子集化后内联，输出 dist/index.html（单文件）
// 配置在 game.json：{ title, bg, fonts: [[family, file.ttf], ...] }；字体文件放 assets/fonts；`import 'three'` 指向 vendor/three.module.js
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const esbuild = require('esbuild');
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'game.json'), 'utf8'));
const ASCII = ' 0123456789,.:/×+-%!?()·…ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz♥★~▶◀▲▼·！？（）：，、。';
function subset(file, chars, tmp) {
  const tf = path.join(tmp, 'chars.txt'), out = path.join(tmp, 'f.woff2'); fs.writeFileSync(tf, chars);
  execFileSync('python', ['-I', '-m', 'fontTools.subset', path.join(ROOT, 'assets/fonts', file), '--text-file=' + tf, '--flavor=woff2', '--output-file=' + out]);
  const b = fs.readFileSync(out).toString('base64'); fs.unlinkSync(tf); fs.unlinkSync(out); return b;
}
(async () => {
  const three = path.join(ROOT, 'vendor/three.module.js');
  const r = await esbuild.build({
    entryPoints: [path.join(ROOT, 'src/entry.js')], bundle: true, minify: true, format: 'esm', write: false, target: ['es2020', 'safari14'], legalComments: 'none',
    alias: fs.existsSync(three) ? { three } : {},
  });
  const js = r.outputFiles[0].text;
  let src = CFG.title;
  (function collect(dir) { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const fp = path.join(dir, f.name); if (f.isDirectory()) collect(fp); else if (/\.(js|json|html)$/.test(f.name)) src += fs.readFileSync(fp, 'utf8'); } })(path.join(ROOT, 'src'));
  const chars = [...new Set(src + ASCII)].filter(ch => ch.codePointAt(0) > 31).join('');
  const out = path.join(ROOT, 'dist'); fs.mkdirSync(out, { recursive: true });
  const css = CFG.fonts.map(([fam, file]) => `@font-face{font-family:${fam};src:url(data:font/woff2;base64,${subset(file, chars, out)}) format('woff2');font-display:block}`).join('');
  let html = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
  html = html.replace('/*FONT*/', css).replace(/\/\*BG\*\//g, CFG.bg).replace('/*TITLE*/', CFG.title).replace('/*FAMS*/', JSON.stringify(CFG.fonts.map(f => f[0]))).replace('/*GAME*/', () => js.replace(/<\/script/g, '<\\/script'));
  fs.writeFileSync(path.join(out, 'index.html'), html);
  console.log('dist/index.html', (html.length / 1024).toFixed(0), 'KB');
})().catch(e => { console.error(e.message || e); process.exit(1); });
