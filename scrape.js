const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const albumUrl = process.env.ALBUM_URL;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log("Opening Album...");
    await page.goto(albumUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // המתנה שהתמונות יתחילו להופיע
    await page.waitForSelector('img', { timeout: 10000 });

    console.log("Scrolling to trigger lazy load...");
    // גלילה עמוקה יותר ואיטית יותר
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1000); 
    }

    // חילוץ הקישורים עם סינון מתקדם
    const imageLinks = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .map(img => img.src)
        .filter(src => {
          // אנחנו רוצים רק תמונות שהן "תוכן" (בדרך כלל עם פרמטרים של גובה/רוחב)
          // ומתעלמים מתמונות פרופיל, אייקונים ולוגו
          return src.includes('googleusercontent.com') && 
                 !src.includes('profile') && 
                 !src.includes('lh3.google.com') && // לעיתים לוגואים
                 src.length > 50; // תמונות אמיתיות בדרך כלל בעלות URL ארוך מאוד
        })
        .map(src => {
          // הפיכה לקישור באיכות גבוהה
          return src.split('=')[0] + '=w2048-h1080';
        });
    });

    const uniqueImages = [...new Set(imageLinks)];

    console.log(`Success! Found ${uniqueImages.length} actual photos.`);
    
    fs.writeFileSync('list.json', JSON.stringify({ 
      lastUpdate: new Date().toISOString(),
      count: uniqueImages.length,
      images: uniqueImages 
    }, null, 2));

  } catch (error) {
    console.error("Scraping failed:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
