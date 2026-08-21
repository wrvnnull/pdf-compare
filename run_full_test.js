const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const OLD = path.join(DIR, 'test/old.pdf');     // 5 pages, differs on 2 & 4
const NEW = path.join(DIR, 'test/new.pdf');     // 5 pages, differs on 2 & 4
const SAME_A = path.join(DIR,'test/sameA.pdf'); // same text, 1-col
const SAME_B = path.join(DIR,'test/sameB.pdf'); // same text, 2-col
const LIVE = (process.env.TARGET && process.env.TARGET.startsWith('http')) ? process.env.TARGET : ('file://'+path.join(DIR,'index.html'));

(async () => {
  const browser = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await browser.newPage();
  const errors=[]; page.on('console',m=>{if(m.type()==='error')errors.push(m.text());}); page.on('pageerror',e=>errors.push('EXC:'+e.message+(e.stack?(' | '+e.stack.split('\n')[1]):'')));

  const target = LIVE + (LIVE.startsWith('file')?'?test=1':'?test=1');
  console.log('OPEN', target);
  await page.goto(target, {waitUntil:'networkidle0', timeout:30000});
  console.log('title:', await page.title());

  // share bar + QR present?
  const shareShown = await page.evaluate(()=> getComputedStyle(document.getElementById('sharebar')).display!=='none');
  const qrHasImg = await page.evaluate(()=> document.querySelector('#qr img, #qr canvas')!=null);
  console.log('sharebar visible:', shareShown, '| QR rendered:', qrHasImg);

  // upload
  await (await page.$('#fileOld')).uploadFile(OLD);
  await (await page.$('#fileNew')).uploadFile(NEW);
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await page.waitForFunction(()=>/halaman: \d+/i.test(document.getElementById('subOld').textContent)&&/halaman: \d+/i.test(document.getElementById('subNew').textContent),{timeout:20000});
  await page.click('#btnCompare');
  await page.waitForFunction(()=>{
    const b=document.getElementById('btnDownload');
    const s=document.getElementById('stat').textContent+document.getElementById('stat').innerHTML;
    return b && !b.disabled && /Berubah|Changed/i.test(s);
  },{timeout:60000});

  const summary = await page.evaluate(()=>[...document.querySelectorAll('.row')].map(r=>r.querySelector('.pg').textContent+' -> '+r.querySelector('.badge').textContent));
  console.log('DETECT (layout-diff, same text):', JSON.stringify(summary));
  // EXPECT: page 1 -> SAMA/SAME  (tolerant of layout)

  // switch to EN and back, check label updates
  await page.click('#lang button[data-l="en"]');
  const enStat = await page.evaluate(()=>document.getElementById('stat').textContent);
  console.log('EN stat text:', enStat);
  await page.click('#lang button[data-l="id"]');

  // export two-up
  await page.click('#btnDownload');
  await page.waitForFunction(()=>window.__lastPdf!=null,{timeout:30000});
  const b64=(await page.evaluate(()=>window.__lastPdf)).split(',')[1];
  fs.writeFileSync(path.join(DIR,'test/out-report.pdf'), Buffer.from(b64,'base64'));
  console.log('report bytes:', Buffer.from(b64,'base64').length);

  // export new-only
  await page.click('#btnDownloadNew');
  await page.waitForFunction(()=>window.__lastPdfNew!=null,{timeout:30000});
  const b642=(await page.evaluate(()=>window.__lastPdfNew)).split(',')[1];
  fs.writeFileSync(path.join(DIR,'test/out-newonly.pdf'), Buffer.from(b642,'base64'));
  console.log('newonly bytes:', Buffer.from(b642,'base64').length);

  console.log('CONSOLE ERRORS:', errors.length?JSON.stringify(errors):'none');

  // ---- layout-tolerance assert: same text, different layout => SAMA ----
  await (await page.$('#fileOld')).uploadFile(SAME_A);
  await (await page.$('#fileNew')).uploadFile(SAME_B);
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await page.waitForFunction(()=>/halaman: \d+/i.test(document.getElementById('subOld').textContent)&&/halaman: \d+/i.test(document.getElementById('subNew').textContent),{timeout:20000});
  await page.click('#btnCompare');
  await page.waitForFunction(()=>{ const b=document.getElementById('btnDownload'); const s=document.getElementById('stat').textContent+document.getElementById('stat').innerHTML; return b && !b.disabled && /Berubah|Changed/i.test(s); },{timeout:60000});
  const tol = await page.evaluate(()=>[...document.querySelectorAll('.row')].map(r=>r.querySelector('.pg').textContent+' -> '+r.querySelector('.badge').textContent));
  console.log('TOLERANCE (same text, diff layout):', JSON.stringify(tol), '=> expect all SAMA');

  await browser.disconnect();
  console.log('TEST DONE');
})().catch(e=>{console.error('FATAL',e);process.exit(1);});
