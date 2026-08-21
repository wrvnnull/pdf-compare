const puppeteer = require('puppeteer-core');
const path = require('path');
(async()=>{
  const b = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await b.newPage();
  const logs=[]; page.on('console',m=>logs.push(m.type()+': '+m.text())); page.on('pageerror',e=>logs.push('ERR:'+e.message));
  await page.goto('https://www.ilovepdf.com/id/bandingkan-pdf', {waitUntil:'networkidle2', timeout:60000});
  await new Promise(r=>setTimeout(r,1500));
  console.log('TITLE:', await page.title());
  // find file inputs
  const inputs = await page.evaluate(()=>{
    const els=[...document.querySelectorAll('input[type=file]')];
    return els.map(e=>({id:e.id, name:e.name, cls:e.className, accept:e.accept}));
  });
  console.log('FILE INPUTS:', JSON.stringify(inputs));
  await page.screenshot({path:'test/view/ilovepdf-1.png'});
  await b.disconnect();
  console.log('LOGS:', logs.slice(0,10).join(' | '));
})().catch(e=>{console.log('FATAL',e.message); process.exit(1);});
