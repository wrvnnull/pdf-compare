const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.connect({ browserURL:'http://localhost:9222', defaultViewport:{width:1000,height:900} });
  const p = await b.newPage();
  await p.goto('https://wrvnnull.github.io/pdf-compare/', {waitUntil:'networkidle0'});
  await p.screenshot({path:'test/view/live-page.png'});
  await b.disconnect();
  console.log('shot saved');
})().catch(e=>{console.error(e.message);process.exit(1);});
