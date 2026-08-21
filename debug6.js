const puppeteer = require('puppeteer-core');
const path = require('path');
const DIR = __dirname;
(async () => {
  const browser = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await browser.newPage();
  page.on('pageerror',e=>console.log('PAGEERR STACK:\n'+(e.stack||e.message)));
  await page.goto('file://'+path.join(DIR,'index.html')+'?test=1', {waitUntil:'networkidle0'});
  await (await page.$('#fileOld')).uploadFile(path.join(DIR,'test/old.pdf'));
  await (await page.$('#fileNew')).uploadFile(path.join(DIR,'test/new.pdf'));
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await new Promise(r=>setTimeout(r,2000));
  await page.click('#btnCompare');
  await new Promise(r=>setTimeout(r,8000));
  await browser.disconnect();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
