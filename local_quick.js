const puppeteer = require('puppeteer-core');
const path=require('path'); const DIR=__dirname;
(async()=>{
  const b=await puppeteer.connect({browserURL:'http://localhost:9222',defaultViewport:{width:1400,height:1000}});
  const page=await b.newPage();
  const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push('C:'+m.text());});
  await page.goto('file://'+path.join(DIR,'index.html')+'?test=1',{waitUntil:'load',timeout:60000});
  await new Promise(r=>setTimeout(r,1000));
  await (await page.$('#fileOld')).uploadFile(path.join(DIR,'test/old.pdf'));
  await (await page.$('#fileNew')).uploadFile(path.join(DIR,'test/new.pdf'));
  await page.evaluate(()=>{document.getElementById('fileOld').dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('fileNew').dispatchEvent(new Event('change',{bubbles:true}));});
  await page.waitForFunction(()=>/halaman: \d+/i.test(document.getElementById('subOld').textContent),{timeout:30000});
  await page.click('#btnCompare');
  await page.waitForFunction(()=>!document.getElementById('btnDownload').disabled,{timeout:90000});
  const labels=await page.evaluate(()=>({cmp:document.getElementById('btnCompare').textContent,sa:document.getElementById('btnSelectAll').textContent,dl:document.getElementById('btnDownload').textContent,dn:document.getElementById('btnDownloadNew').textContent}));
  console.log('LABELS:',JSON.stringify(labels));
  // test select all
  await page.click('#btnSelectAll');
  const checked=await page.evaluate(()=>[...document.querySelectorAll('.row')].filter(r=>r.querySelector('.sel input').checked).length);
  console.log('checked after selectAll:',checked);
  console.log('ERRORS:',errs.length?JSON.stringify(errs):'none');
  await b.disconnect();
})().catch(e=>{console.log('FATAL',e.message);process.exit(1);});
