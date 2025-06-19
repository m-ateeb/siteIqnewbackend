
import axios from "axios";
import * as cheerio from 'cheerio';

const scrapeWebsite = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Extract SEO relevant data
    const seoData = {
      title: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content'),
      h1: $('h1').map((i, el) => $(el).text()).get(),
      h2: $('h2').map((i, el) => $(el).text()).get(),  // ✅ FIXED HERE
      images: $('img').map((i, el) => ({
        src: $(el).attr('src'),
        alt: $(el).attr('alt') || '',
      })).get(),
      links: $('a').map((i, el) => ({
        href: $(el).attr('href'),
        text: $(el).text(),
      })).get(),
      canonical: $('link[rel="canonical"]').attr('href'),
    };

    return seoData;
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw error;
  }
};

export default { scrapeWebsite };
