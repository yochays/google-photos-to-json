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
    viewport: { width: 1920, height: 1080 }
  });

  try {
    console.log("Connecting to album...");
    // טעינת הדף והמתנה עד שהרשת תהיה שקטה
    await page.goto(albumUrl, { waitUntil: 'networkidle' });
    
    // המתנה ספציפית לאלמנט שמכיל את התמונות באלבום
    await page.waitForSelector('img', { timeout: 10000 });
    
    console.log("Scrolling to load images...");
    // גלילה הדרגתית כדי לוודא שגוגל טוענת את התמונות (Lazy Loading)
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(1000);
    }

    // חילוץ המידע
    const imageSources = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .map(img => img.src)
        .filter(src => {
          // סינון: רק קישורי תמונות של גוגל, ללא תמונות פרופיל וללא אייקונים קטנים
          return src.includes('googleusercontent.com') && 
                 !src.includes('profile') && 
                 !src.includes('placeholder');
        })
        .map(src => {
          // קבלת התמונה ברזולוציה גבוהה
          return src.split('=')[0] + '=w2048'; 
        });
    });

    const finalLinks = [...new Set(imageSources)];
    
    if (finalLinks.length === 0) {
        console.log("No images found. You might need to check if the album is public.");
    }

    fs.writeFileSync('list.json', JSON.stringify({ images: finalLinks }, null, 2));
    console.log(`Successfully found ${finalLinks.length} images.`);

  } catch (error) {
    console.error("Error during scraping:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
