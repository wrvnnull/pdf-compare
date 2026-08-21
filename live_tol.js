const puppeteer = require('puppeteer-core');
const path = require('path'); const DIR = __dirname;
(async () => {
  const b = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await b.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.goto('https://wrvnnull.github.io/pdf-compare/?test=1', {waitUntil:'networkidle0'});
  await (await page.$('#fileOld')).uploadFile(path.join(DIR,'test/sameA.pdf'));
  await (await page.$('#fileNew')).uploadFile(path.join(DIR,'test/sameB.pdf'));
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await page.waitForFunction(()=>/halaman: \d+/i.test(document.getElementById('subOld').textContent)&&/halaman: \d+/i.test(document.getElementById('subNew').textContent),{timeout:20000});
  await page.click('#btnCompare');
  await page.waitForFunction(()=>{ const s=document.getElementById('stat').textContent; return !document.getElementById('btnDownload').disabled && /Berubah|Changed/i.test(s); },{timeout:60000});
  const tol = await page.evaluate(()=>[...document.querySelectorAll('.row')].map(r=>r.querySelector('.pg').textContent+' -> '+r.querySelector('.badge').textContent));
  console.log('LIVE TOLERANCE (same text, diff layout):', JSON.stringify(tol));
  // QR + copy present
  const qr = await page.evaluate(()=>!!document.querySelector('#qr img'));
  console.log('LIVE QR present:', qr);
  console.log('PAGE ERRORS:', errs.length?JSON.stringify(errs):'none');
  await b.disconnect();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
