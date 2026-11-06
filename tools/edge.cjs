const puppeteer = require('puppeteer-core');
module.exports = () => puppeteer.launch({
  executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  defaultViewport: null,
  args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', ...(process.env.EDGE_PROXY ? ['--proxy-server=' + process.env.EDGE_PROXY] : [])],
});

