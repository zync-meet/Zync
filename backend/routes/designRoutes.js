const express = require('express');
const router = express.Router();

// Dribbble API Endpoint
const DRIBBBLE_API_URL = 'https://api.dribbble.com/v2/user/shots';

router.get('/search', async (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const accessToken = process.env.DRIBBBLE_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'Dribbble Access Token is missing in server configuration.' });
  }

  try {
    // Note: Dribbble V2 API does not have a public search endpoint for free tier apps.
    // We are fetching the authenticated user's shots or a list of shots and filtering them.
    // For a real "search" across all Dribbble, you would need a specific partner API access or similar.
    // Here we fetch the shots available to the token and filter them in memory as a best-effort implementation.
    
    const response = await fetch(`${DRIBBBLE_API_URL}?access_token=${accessToken}&per_page=100`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dribbble API Error:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to fetch from Dribbble API' });
    }

    const shots = await response.json();

    // Filter shots based on query (title or description)
    // If query is empty, return all fetched shots
    const filteredShots = query 
      ? shots.filter(shot => 
          (shot.title && shot.title.toLowerCase().includes(query)) || 
          (shot.description && shot.description.toLowerCase().includes(query))
        )
      : shots;

    res.json(filteredShots);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
