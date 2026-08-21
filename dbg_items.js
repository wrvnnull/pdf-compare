const puppeteer = require('puppeteer-core');
const path=require('path'); const DIR=__dirname;
(async()=>{
  const b=await puppeteer.connect({browserURL:'http://localhost:9222'});
  const p=await b.newPage();
  await p.goto('file://'+path.join(DIR,'index.html')+'?test=1',{waitUntil:'networkidle0'});
  // inject file by setting input files
  await p.evaluate(()=> new Promise(res=>{
    const inp=document.createElement('input'); inp.type='file';
    inp.addEventListener('change', async ()=>{
      const f=inp.files[0]; const buf=await f.arrayBuffer();
      const doc=await pdfjsLib.getDocument({data:buf}).promise;
      const pg=await doc.getPage(5);
      const a=await pg.getTextContent();
      const c=await pg.getTextContent({disableCombineTextItems:true});
      const sampleA=a.items.filter(i=>i.str&&i.str.trim()).slice(0,3).map(i=>i.str.slice(0,40));
      const sampleC=c.items.filter(i=>i.str&&i.str.trim()).slice(0,8).map(i=>i.str.slice(0,25));
      window.__R={combined:a.items.length, uncombined:c.items.length, sampleA, sampleC};
      res();
    }, {once:true});
    inp.id='__dbg'; document.body.appendChild(inp); inp.click();
  }));
  const up = await p.$('#__dbg');
  await up.uploadFile(path.join(DIR,'test/skripsi-lama.pdf'));
  await new Promise(r=>setTimeout(r,3000));
  console.log(JSON.stringify(await p.evaluate(()=>window.__R),null,2));
  await b.disconnect();
})().catch(e=>{console.error(e.message);process.exit(1);});
