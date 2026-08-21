const puppeteer = require('puppeteer-core');
const path = require('path');
const DIR = __dirname;
(async () => {
  const browser = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await browser.newPage();
  const logs=[]; page.on('console',m=>logs.push('['+m.type()+'] '+m.text())); page.on('pageerror',e=>logs.push('EXC:'+e.message));
  await page.goto('file://'+path.join(DIR,'index.html')+'?test=1', {waitUntil:'networkidle0'});
  await (await page.$('#fileOld')).uploadFile(path.join(DIR,'test/sameA.pdf'));
  await (await page.$('#fileNew')).uploadFile(path.join(DIR,'test/sameB.pdf'));
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await new Promise(r=>setTimeout(r,3000));
  const sub = await page.evaluate(()=>({o:document.getElementById('subOld')?document.getElementById('subOld').textContent:'NULL', n:document.getElementById('subNew')?document.getElementById('subNew').textContent:'NULL'}));
  console.log('sub after 3s:', JSON.stringify(sub));
  await page.click('#btnCompare');
  await new Promise(r=>setTimeout(r,10000));
  const dbg = await page.evaluate(()=>({
    stat: document.getElementById('stat')?document.getElementById('stat').textContent:'(no stat)',
    rows: document.querySelectorAll('.row').length
  }));
  console.log('DEBUG after compare:', JSON.stringify(dbg));
  console.log('--- logs ---'); logs.forEach(l=>console.log(l));
  await browser.disconnect();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
