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

    // חילוץ הקישורים הישירים לתמונות
    const imageData = await page.evaluate(() => {
      // מוצא את כל התמונות בתוך האלבום
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .map(img => img.src)
        .filter(src => src.includes('googleusercontent.com'))
        .map(src => {
          // טריק: הסיומת =w... קובעת את גודל התמונה. 
          // נחליף אותה ב-d כדי לקבל את המקור או ב-w2000 כדי לקבל איכות גבוהה
          return src.split('=')[0] + '=w2048'; 
        });
    });

    const uniqueImages = [...new Set(imageData)];
    
    fs.writeFileSync('list.json', JSON.stringify({ images: uniqueImages }, null, 2));

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
