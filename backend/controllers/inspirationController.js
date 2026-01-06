const axios = require('axios');
const Parser = require('rss-parser');

const UNSPLASH_BASE = 'https://api.unsplash.com';
const PINTEREST_BASE = 'https://api.pinterest.com/v5';
const parser = new Parser();

async function fetchUnsplash(query = 'web design', page = 1, per_page = 30) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error('UNSPLASH_ACCESS_KEY missing');

  const resp = await axios.get(`${UNSPLASH_BASE}/search/photos`, {
    params: { query, page, per_page },
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  return resp.data.results.map(r => ({
    id: `unsplash_${r.id}`,
    source: 'unsplash',
    title: r.alt_description || r.description || 'Untitled',
    image: r.urls?.regular || r.urls?.full,
    thumb: r.urls?.small,
    photographer: r.user?.name,
    photographerProfile: r.user?.links?.html,
    link: r.links?.html,
  }));
}

async function fetchPinterest(boardId, token, page_size = 25) {
  if (!boardId) return [];
  const t = token || process.env.PINTEREST_TOKEN;
  if (!t) throw new Error('PINTEREST_TOKEN missing');

  const resp = await axios.get(`${PINTEREST_BASE}/boards/${boardId}/pins`, {
    headers: { Authorization: `Bearer ${t}` },
    params: { page_size },
  });

  const data = resp.data?.items || resp.data?.results || [];
  return data.map(p => ({
    id: `pinterest_${p.id}`,
    source: 'pinterest',
    title: p.note || p.title || '',
    image: (p.image && p.image.url) || (p.images && p.images[0] && p.images[0].url) || null,
    link: p.link || p.url || null,
  }));
}

async function fetchBehance(query = 'web design', limit = 50) {
  try {
    // Fetch from Behance RSS feed with tags
    const feedUrl = `https://www.behance.net/feeds/projects?tags=${encodeURIComponent(query)}`;
    const feed = await parser.parseURL(feedUrl);

    const results = [];
    feed.items.forEach((item, index) => {
      if (results.length >= limit) return;

      // Extract image URL from content or description
      let image = null;
      const content = item.content || item.description || '';
      const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch && imgMatch[1]) {
        image = imgMatch[1];
      }
      
      // Use GUID or Link + Index to ensure uniqueness
      // base64(link) slice(0,8) was causing collisions because all links start with https://
      const uniqueId = item.guid || item.link || `no-link-${index}`;

      results.push({
        id: `behance_${Buffer.from(uniqueId).toString('base64')}`,
        source: 'behance',
        title: item.title || 'Untitled',
        image: image,
        link: item.link,
        creator: item.creator || item.author || 'Unknown',
      });
    });

    return results;
  } catch (error) {
    console.error('Behance RSS fetch error:', error.message);
    return [];
  }
}

// Express controller
async function getInspiration(req, res) {
  const q = req.query.q || 'web design';
  const unsplashPage = parseInt(req.query.up) || 1;
  const unsplashPer = parseInt(req.query.upp) || 30;
  const pinterestBoard = req.query.pboard || process.env.PINTEREST_BOARD_ID;
  const pinterestToken = req.header('x-pinterest-token') || process.env.PINTEREST_TOKEN;

  try {
    const [unsplash, pinterest, behance] = await Promise.all([
      fetchUnsplash(q, unsplashPage, unsplashPer).catch(e => { console.error('Unsplash error', e.message); return []; }),
      (async () => {
        try {
          return await fetchPinterest(pinterestBoard, pinterestToken, 50);
        } catch (e) {
          console.error('Pinterest error', e.message);
          return [];
        }
      })(),
      fetchBehance(q, 50),
    ]);

    // Unified list
    const unified = [...unsplash, ...pinterest, ...behance];
    res.json({ ok: true, count: unified.length, items: unified });
  } catch (error) {
    console.error('Controller error', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}

async function getBehance(req, res) {
  const q = req.query.q || 'web design';
  try {
    const items = await fetchBehance(q, 50);
    res.json(items);
  } catch (error) {
    console.error('Behance controller error', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getInspiration, getBehance };
