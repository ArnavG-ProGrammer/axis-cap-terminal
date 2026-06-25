const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  
  async function testTicker(ticker) {
    const page = await browser.newPage();
    let hasError = false;
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[${ticker}] BROWSER ERROR:`, msg.text());
        hasError = true;
      }
    });

    page.on('pageerror', err => {
      console.log(`[${ticker}] PAGE ERROR:`, err.toString());
      hasError = true;
    });

    console.log(`Testing ${ticker}...`);
    await page.goto(`http://localhost:3000/stock/${ticker}`, { waitUntil: 'networkidle0' });
    
    if (!hasError) {
       console.log(`[${ticker}] Loaded successfully without errors.`);
    }
    await page.close();
  }

  await testTicker('AAPL');
  await testTicker('TSLA');
  await testTicker('GC=F'); // Gold Commodity

  await browser.close();
})();
