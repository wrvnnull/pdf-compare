const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OLD = path.join(DIR, 'test/old.pdf');
const NEW = path.join(DIR, 'test/new.pdf');
const LIVE = 'https://wrvnnull.github.io/pdf-compare/?test=1';

(async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9223',
    defaultViewport: {width: 1400, height: 1000}
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('EXC: '+e.message));

  console.log('opening', LIVE);
  await page.goto(LIVE, {waitUntil:'networkidle0', timeout: 30000});
  console.log('title:', await page.title());

  // upload
  await (await page.$('#fileOld')).uploadFile(OLD);
  await (await page.$('#fileNew')).uploadFile(NEW);
  await page.evaluate(() => {
    document.getElementById('fileOld').dispatchEvent(new Event('change', {bubbles:true}));
    document.getElementById('fileNew').dispatchEvent(new Event('change', {bubbles:true}));
  });
  await page.waitForFunction(() => /halaman: \d+/.test(document.getElementById('subOld').textContent) && /halaman: \d+/.test(document.getElementById('subNew').textContent), {timeout: 20000});

  await page.click('#btnCompare');
  await page.waitForFunction(() => !document.getElementById('btnDownload').disabled && /Berubah:/.test(document.getElementById('stat').innerHTML), {timeout: 60000});

  const summary = await page.evaluate(() => [...document.querySelectorAll('.row')].map(r => r.querySelector('.pg').textContent + ' -> ' + r.querySelector('.badge').textContent));
  console.log('PER-PAGE:', JSON.stringify(summary));

  await page.click('#btnDownload');
  await page.waitForFunction(() => window.__lastPdf != null, {timeout: 30000});
  const b64 = (await page.evaluate(() => window.__lastPdf)).split(',')[1];
  fs.writeFileSync(path.join(DIR,'test/live-report.pdf'), Buffer.from(b64,'base64'));
  console.log('live report bytes:', Buffer.from(b64,'base64').length);

  await page.click('#btnDownloadNew');
  await page.waitForFunction(() => window.__lastPdfNew != null, {timeout: 30000});
  const b642 = (await page.evaluate(() => window.__lastPdfNew)).split(',')[1];
  fs.writeFileSync(path.join(DIR,'test/live-newonly.pdf'), Buffer.from(b642,'base64'));
  console.log('live newonly bytes:', Buffer.from(b642,'base64').length);

  console.log('CONSOLE ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await browser.disconnect();
  console.log('LIVE TEST DONE');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
