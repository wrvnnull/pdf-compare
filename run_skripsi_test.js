const puppeteer = require('puppeteer-core');
const path = require('path'); const fs=require('fs'); const DIR=__dirname;
(async () => {
  const b = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1400,height:1000} });
  const page = await b.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file://'+path.join(DIR,'index.html')+'?test=1&max=6', {waitUntil:'load'});
  await (await page.$('#fileOld')).uploadFile(path.join(DIR,'test/skripsi-lama.pdf'));
  await (await page.$('#fileNew')).uploadFile(path.join(DIR,'test/skripsi-baru.pdf'));
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await page.waitForFunction(()=>/halaman: \d+/i.test(document.getElementById('subOld').textContent)&&/halaman: \d+/i.test(document.getElementById('subNew').textContent),{timeout:30000});
  await page.click('#btnCompare');
  await page.waitForFunction(()=>{ const s=document.getElementById('stat').textContent; return !document.getElementById('btnDownload').disabled && /Berubah|Changed/i.test(s); },{timeout:180000});
  const sum = await page.evaluate(()=>[...document.querySelectorAll('.row')].map(r=>r.querySelector('.pg').textContent+' -> '+r.querySelector('.badge').textContent));
  console.log('SKRIPSI detect (first 20):', JSON.stringify(sum));
  // render row canvases to PNG for halaman 5 (index4) and 6 (index5)
  for(const idx of [4,5,13,14]){ // pages 5,6,14,15
    const ok = await page.evaluate((idx)=>{
      const row=document.querySelectorAll('.row')[idx]; if(!row) return false;
      const cv=row.querySelectorAll('canvas');
      cv.forEach((c,n)=>{ const a=document.createElement('a'); });
      return cv.length;
    }, idx);
    // use page to export canvas as png
    const data = await page.evaluate((idx)=>{
      const row=document.querySelectorAll('.row')[idx]; if(!row) return null;
      const cv=row.querySelectorAll('canvas');
      return { old: cv[0]?cv[0].toDataURL('image/png'):null, neu: cv[1]?cv[1].toDataURL('image/png'):null,
               pg: row.querySelector('.pg').textContent };
    }, idx);
    if(data && data.old){
      fs.writeFileSync(path.join(DIR,'test/view/sk-'+idx+'-old.png'), Buffer.from(data.old.split(',')[1],'base64'));
      fs.writeFileSync(path.join(DIR,'test/view/sk-'+idx+'-new.png'), Buffer.from(data.neu.split(',')[1],'base64'));
      console.log('saved page', data.pg);
    }
  }
  console.log('PAGE ERRORS:', errs.length?JSON.stringify(errs):'none');
  await b.disconnect();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
