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
    viewport: { width: 1280, height: 1500 } // מסך גבוה כדי לראות יותר תמונות
  });

  try {
    console.log("Connecting to album...");
    await page.goto(albumUrl, { waitUntil: 'networkidle' });
    
    // המתנה וגלילה הדרגתית כדי לטעון את כל התמונות
    await page.waitForTimeout(5000);
    for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await page.waitForTimeout(1000);
    }

    // חילוץ הקישורים הישירים מהתגיות של התמונות (img)
    const imageSources = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .map(img => img.src)
        // מחפשים רק קישורים של גוגל שמכילים את התוכן של התמונה
        .filter(src => src.includes('googleusercontent.com'))
        .map(src => {
          // ניקוי הפרמטרים בסוף הקישור כדי לקבל איכות גבוהה (w2048)
          return src.split('=')[0] + '=w2048'; 
        });
    });

    // הסרת כפילויות
    const finalLinks = [...new Set(imageSources)];
    
    // כתיבה לקובץ - שים לב שמשתמשים ב-finalLinks
    fs.writeFileSync('list.json', JSON.stringify({ images: finalLinks }, null, 2));
    
    console.log(`Successfully found ${finalLinks.length} images.`);
  } catch (error) {
    console.error("Error during scraping:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
