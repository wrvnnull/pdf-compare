const puppeteer = require('puppeteer-core');
const path = require('path');
(async()=>{
  const b = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await b.newPage();
  const logs=[]; page.on('pageerror',e=>logs.push('ERR:'+e.message));
  await page.goto('https://www.ilovepdf.com/id/bandingkan-pdf', {waitUntil:'networkidle2', timeout:60000});
  await new Promise(r=>setTimeout(r,1200));
  const oldP='/home/ubuntu/skripsi/skripsi lama.pdf', newP='/home/ubuntu/skripsi/skripsi baru.pdf';
  const inp1 = await page.$('#first-file'); const inp2 = await page.$('#second-file');
  await inp1.uploadFile(oldP); await new Promise(r=>setTimeout(r,800));
  await inp2.uploadFile(newP); await new Promise(r=>setTimeout(r,1500));
  console.log('uploaded. looking for compare button...');
  // click compare / process button
  const clicked = await page.evaluate(()=>{
    const btns=[...document.querySelectorAll('button, a.btn, .pdf-compare')];
    const b = btns.find(x=>/bandingkan|compare|proses|process/i.test(x.textContent||x.title||''));
    if(b){ b.click(); return b.textContent.trim().slice(0,40); }
    return 'NO_BTN';
  });
  console.log('clicked:', clicked);
  // wait for result iframe/canvas
  await new Promise(r=>setTimeout(r,15000));
  await page.screenshot({path:'test/view/ilovepdf-2.png', fullPage:false});
  // try to find result container
  const info = await page.evaluate(()=>{
    const ifr=document.querySelector('iframe');
    return { iframes: !!ifr, bodyLen: document.body.innerText.length,
      txt: document.body.innerText.slice(0,300) };
  });
  console.log('INFO:', JSON.stringify(info));
  await b.disconnect();
  console.log('ERR:', logs.join(' | ')||'none');
})().catch(e=>{console.log('FATAL',e.message); process.exit(1);});
