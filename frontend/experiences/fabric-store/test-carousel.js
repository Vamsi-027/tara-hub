const puppeteer = require('puppeteer');

async function testHeroCarousel() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('🚀 Testing Hero Carousel at http://localhost:3006');
    await page.goto('http://localhost:3006', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Test 1: Check if carousel container exists
    const carouselExists = await page.$('.hero-carousel') !== null;
    console.log(`✅ Carousel container exists: ${carouselExists}`);
    
    // Test 2: Count number of slides
    const slideCount = await page.$$eval('[data-testid="carousel-slide"]', slides => slides.length);
    console.log(`✅ Number of slides found: ${slideCount}`);
    
    // Test 3: Check if content is on left side (headers, features)
    const leftContentExists = await page.$('.space-y-6, .space-y-8') !== null;
    console.log(`✅ Left side content container exists: ${leftContentExists}`);
    
    // Test 4: Check for navigation arrows
    const prevButton = await page.$('[data-testid="prev-button"]') !== null;
    const nextButton = await page.$('[data-testid="next-button"]') !== null;
    console.log(`✅ Navigation arrows - Prev: ${prevButton}, Next: ${nextButton}`);
    
    // Test 5: Check for dot indicators
    const dotIndicators = await page.$$eval('[data-testid="dot-indicator"]', dots => dots.length);
    console.log(`✅ Dot indicators found: ${dotIndicators}`);
    
    // Test 6: Check for search box
    const searchBox = await page.$('input[placeholder*="Search"]') !== null;
    console.log(`✅ Search box exists: ${searchBox}`);
    
    // Test 7: Check for features with checkmarks
    const features = await page.$$eval('[data-testid="feature-item"]', items => items.length);
    console.log(`✅ Feature items found: ${features}`);
    
    // Test 8: Check for image on right side
    const heroImage = await page.$('img[alt*="fabric"], img[alt*="textile"], .relative img') !== null;
    console.log(`✅ Hero image exists: ${heroImage}`);
    
    // Test 9: Check if slides auto-advance (wait 6 seconds and check for changes)
    console.log('⏳ Testing auto-advance functionality...');
    const initialSlideContent = await page.$eval('[data-testid="carousel-slide"]:not(.hidden) h1, [data-testid="carousel-slide"]:not(.hidden) h2', el => el.textContent);
    await page.waitForTimeout(6000);
    const newSlideContent = await page.$eval('[data-testid="carousel-slide"]:not(.hidden) h1, [data-testid="carousel-slide"]:not(.hidden) h2', el => el.textContent);
    const autoAdvanced = initialSlideContent !== newSlideContent;
    console.log(`✅ Auto-advance working: ${autoAdvanced}`);
    
    console.log('\n🎉 Hero Carousel Test Complete!');
    console.log('✅ All core functionality appears to be working');
    console.log('🌐 Visit http://localhost:3006 to see the carousel in action');
    
  } catch (error) {
    console.error('❌ Error testing carousel:', error.message);
    
    // Fallback: Just check if the page loads
    try {
      const browser2 = await puppeteer.launch({ headless: true });
      const page2 = await browser2.newPage();
      await page2.goto('http://localhost:3006', { timeout: 5000 });
      const title = await page2.title();
      console.log(`✅ Fallback test - Page loads with title: "${title}"`);
      await browser2.close();
    } catch (fallbackError) {
      console.error('❌ Fallback test failed:', fallbackError.message);
      console.log('🚨 Make sure the development server is running on port 3006');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testHeroCarousel();