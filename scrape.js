const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const albumUrl = process.env.ALBUM_URL; // נקבל את הכתובת מההגדרות
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(albumUrl);
  
  // המתנה לטעינה וגלילה כדי לראות את כל התמונות
  await page.waitForTimeout(5000);
  await page.evaluate(async () => {
    window.scrollBy(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(2000);

  // חילוץ הקישורים
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors
      .map(a => a.href)
      .filter(href => href.includes('photo/'));
  });

  const uniqueLinks = [...new Set(links)];
  fs.writeFileSync('list.json', JSON.stringify({ images: uniqueLinks }, null = 2));
  
  await browser.close();
  console.log(`Found ${uniqueLinks.length} images.`);
})();
