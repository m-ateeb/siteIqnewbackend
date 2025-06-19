import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';


const runLighthouse = async (url) => {
  let browser;
  
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const options = {
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: (new URL(browser.wsEndpoint())).port,
    };

    // Run Lighthouse
    const runnerResult = await lighthouse(url, options);

    return runnerResult.lhr;
  } catch (error) {
    console.error('Lighthouse error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};


export default { runLighthouse };