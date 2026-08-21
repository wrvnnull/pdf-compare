const puppeteer = require('puppeteer-core');
const path = require('path');
const DIR = __dirname;
(async () => {
  const browser = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1280,height:900} });
  const page = await browser.newPage();
  page.on('pageerror',e=>console.log('EXC:',e.message));
  page.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE-ERR:',m.text()); });
  await page.goto('file://'+path.join(DIR,'index.html')+'?test=1', {waitUntil:'networkidle0'});
  await (await page.$('#fileOld')).uploadFile(path.join(DIR,'test/sameA.pdf'));
  await (await page.$('#fileNew')).uploadFile(path.join(DIR,'test/sameB.pdf'));
  await page.evaluate(()=>{ document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true})); });
  await new Promise(r=>setTimeout(r,2000));
  await page.click('#btnCompare');
  await new Promise(r=>setTimeout(r,6000));
  const r = await page.evaluate(async ()=>{
    const sel=state.rows.filter(x=>x.selDom.checked && x.status!=='same');
    return 'sel count='+sel.length+', state='+(state?Object.keys(state):'null');
  });
  console.log(r);
  // manually run the export logic to see error
  const r2 = await page.evaluate(async ()=>{
    try{
      const sel=state.rows.filter(x=>x.selDom.checked && x.status!=='same');
      if(!sel.length) return 'no sel';
      const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
      const PW=doc.internal.pageSize.getWidth();
      return 'PW='+PW+' jsPDF OK';
    }catch(e){ return 'ERR '+e.message+' | '+e.stack; }
  });
  console.log('export-prep:', r2);
  await browser.disconnect();
})().catch(e=>{console.error('FATAL',e.message);process.exit(1);});
