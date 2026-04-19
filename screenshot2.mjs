import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.fill('[data-testid="login-email"]', 'admin@ilgfood.com');
  await page.fill('[data-testid="login-password"]', 'ilg2026!');
  await page.click('[data-testid="login-submit"]');
  console.log("Waiting for nav...");
  try {
    await page.waitForSelector('nav', { timeout: 10000 });
    console.log("Nav found!");
  } catch(e) {
    console.log("Nav NOT found, dumping DOM.");
    const html = await page.content();
    console.log(html.substring(0, 1000) + "...");
    
    // Check what is on screen
    const text = await page.evaluate(() => document.body.innerText);
    console.log("Body text:", text);
  }
  await browser.close();
})();
