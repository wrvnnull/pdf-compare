const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.connect({browserURL:'http://localhost:9223'});
  const p = await b.newPage();
  p.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
  await p.goto('https://wrvnnull.github.io/pdf-compare/?test=1', {waitUntil:'networkidle0', timeout:30000});
  await b.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
