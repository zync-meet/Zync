const fs = require('fs');
const path = require('path');
const { getSharedBrowser, scrapeDribbble } = require('../services/scraperService');
const { paginateArray, setPaginationHeaders } = require('../utils/pagination');

const DATA_FILE = path.join(__dirname, '../data/inspiration.json');

let CACHED_DATA = null;


async function getInspiration(req, res) {
  const query = (req.query.q || '').toLowerCase().trim();
  console.log(`\n========== INSPIRATION REQUEST (HYBRID): "${query}" ==========`);

  try {

    let allItems = [];

    if (CACHED_DATA) {
      allItems = [...CACHED_DATA];
    } else {
      try {
        const rawData = await fs.promises.readFile(DATA_FILE, 'utf-8');
        CACHED_DATA = JSON.parse(rawData);
        allItems = [...CACHED_DATA];
      } catch (err) {
        CACHED_DATA = [];
        if (err.code === 'ENOENT') {
          console.warn('WARN: Static cache file not found.');
        } else {
          console.warn(`WARN: Failed to read cache file: ${err.message}`);
        }
      }
    }


    if (query && query !== 'web design') {
      allItems = allItems.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(query);
        const sourceMatch = item.source?.toLowerCase().includes(query);
        const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));

        return titleMatch || sourceMatch || tagMatch;
      });
    }

    console.log(`Matched ${allItems.length} items from cache.`);


    if (allItems.length < 5 && query) {
      console.log(`⚠️ Low cache results for "${query}". Triggering live Dribbble fallback...`);
      try {
        const browser = await getSharedBrowser();
        const dribbbleItems = await scrapeDribbble(browser, query);

        if (dribbbleItems.length > 0) {
          console.log(`✨ Live Dribbble scraped ${dribbbleItems.length} items.`);

          const existingIds = new Set(allItems.map(i => i.link));
          const newItems = dribbbleItems.filter(i => !existingIds.has(i.link));
          allItems = [...allItems, ...newItems];
        } else {
          console.log('⚠️ Live Dribbble returned 0 items.');
        }
      } catch (err) {
        console.error('Live Fallback Error:', err.message);
      }
    }


    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    const { items, pagination } = paginateArray(allItems, req.query);
    setPaginationHeaders(res, pagination);

    res.json({
      ok: true,
      count: items.length,
      total: allItems.length,
      items
    });

  } catch (error) {
    console.error('Inspiration Controller Error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}


async function getDribbbleInspiration(req, res) {
  return getInspiration(req, res);
}

module.exports = { getInspiration, getDribbbleInspiration };
