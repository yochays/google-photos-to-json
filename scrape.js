const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const albumUrl = process.env.ALBUM_URL;
  if (!albumUrl) {
    console.error("Missing ALBUM_URL environment variable");
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 } // הגדרת גודל מסך סטנדרטי
  });

  try {
    console.log("Connecting to album...");
    await page.goto(albumUrl, { waitUntil: 'networkidle' });
    
    // המתנה וגלילה כדי לטעון תמונות
    await page.waitForTimeout(5000);
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    // חילוץ הקישורים
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors
        .map(a => a.href)
        .filter(href => href.includes('photo/'));
    });

    const uniqueLinks = [...new Set(links)];
    
    // התיקון כאן: שימוש בפסיק במקום שווה
    fs.writeFileSync('list.json', JSON.stringify({ images: uniqueLinks }, null, 2));
    
    console.log(`Successfully found ${uniqueLinks.length} images.`);
  } catch (error) {
    console.error("Error during scraping:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
