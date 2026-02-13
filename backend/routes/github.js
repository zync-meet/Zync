const express = require('express');
const router = express.Router();
const axios = require('axios');
const CryptoJS = require('crypto-js');
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.warn("WARNING: ENCRYPTION_KEY is not defined in environment variables.");
}

const encryptToken = (token) => {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
};

const decryptToken = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// POST /connect - Validate and save GitHub token
router.post('/connect', verifyToken, async (req, res) => {
  const { accessToken } = req.body;
  const uid = req.user.uid;

  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required' });
  }

  try {
    const githubResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const githubUsername = githubResponse.data.login;
    const encryptedToken = encryptToken(accessToken);

    const updatedUser = await prisma.user.update({
      where: { uid },
      data: {
        githubIntegration: {
          connected: true,
          accessToken: encryptedToken,
          username: githubUsername,
          connectedAt: new Date().toISOString()
        }
      }
    });

    res.json({
      message: 'GitHub connected successfully',
      username: githubUsername
    });

  } catch (error) {
    console.error('Error connecting GitHub:', error.message);
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ message: 'Invalid GitHub access token' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /disconnect - Unlink GitHub account
router.delete('/disconnect', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    await prisma.user.update({
      where: { uid },
      data: {
        githubIntegration: {
          connected: false,
          accessToken: null,
          username: null,
          installationId: null
        }
      }
    });

    res.json({ message: 'GitHub disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting GitHub:', error.message);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Failed to disconnect GitHub' });
  }
});

// POST /callback - OAuth callback to exchange code for access token
router.post('/callback', verifyToken, async (req, res) => {
  const { code } = req.body;
  const uid = req.user.uid;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: clientId,
      client_secret: clientSecret,
      code: code
    }, {
      headers: { Accept: 'application/json' }
    });

    const { access_token, error, error_description } = tokenResponse.data;

    if (error || !access_token) {
      console.error('GitHub OAuth error:', error, error_description);
      return res.status(400).json({ message: error_description || 'Failed to exchange code for token' });
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const githubUser = userResponse.data;
    const encryptedToken = encryptToken(access_token);

    await prisma.user.update({
      where: { uid },
      data: {
        githubIntegration: {
          connected: true,
          accessToken: encryptedToken,
          username: githubUser.login,
          connectedAt: new Date().toISOString()
        }
      }
    });

    res.json({
      message: 'GitHub connected successfully',
      username: githubUser.login
    });

  } catch (error) {
    console.error('Error in GitHub OAuth callback:', error.message);
    res.status(500).json({ message: 'Failed to complete GitHub authentication' });
  }
});

// GET /repos - Fetch user's repositories
router.get('/repos', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const github = user?.githubIntegration;

    if (!user || !github?.connected || !github?.accessToken) {
      return res.status(400).json({ message: 'GitHub account not connected' });
    }

    let accessToken;
    try {
      accessToken = decryptToken(github.accessToken);
    } catch (err) {
      console.error("Decryption failed:", err);
      return res.status(500).json({ message: 'Failed to decrypt access token' });
    }

    if (!accessToken) {
      return res.status(500).json({ message: 'Invalid stored token' });
    }

    const githubResponse = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        visibility: 'all',
        per_page: 100
      }
    });

    res.json(githubResponse.data);

  } catch (error) {
    console.error('Error fetching GitHub repos:', error.message);

    if (error.response && error.response.status === 401) {
      await prisma.user.update({
        where: { uid },
        data: {
          githubIntegration: { ...(await prisma.user.findUnique({ where: { uid } }))?.githubIntegration, connected: false }
        }
      });
      return res.status(401).json({ message: 'GitHub token expired. Please reconnect.' });
    }

    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
});

// POST /install - Save Installation ID from Callback
router.post('/install', verifyToken, async (req, res) => {
  const { installationId } = req.body;
  const uid = req.user.uid;

  if (!installationId) {
    return res.status(400).json({ message: 'Installation ID required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const existingGithub = user?.githubIntegration || {};

    const updatedUser = await prisma.user.update({
      where: { uid },
      data: {
        githubIntegration: {
          ...existingGithub,
          installationId: installationId.toString(),
          connected: true,
          connectedAt: new Date().toISOString()
        }
      }
    });

    res.json({ message: 'GitHub App Installation Connected', user: updatedUser });
  } catch (error) {
    console.error('Error saving installation ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper to update github integration to disconnected state
const disconnectGithub = async (uid, extra = {}) => {
  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const existing = user?.githubIntegration || {};
    await prisma.user.update({
      where: { uid },
      data: {
        githubIntegration: {
          ...existing,
          connected: false,
          ...extra
        }
      }
    });
  } catch (e) {
    console.error('Failed to disconnect github:', e);
  }
};

// GET /user-repos - Fetch all repos accessible to the GitHub App Installation
router.get('/user-repos', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const github = user?.githubIntegration;

    if (!user || !github?.installationId) {
      return res.status(400).json({
        message: 'GitHub App not installed',
        notInstalled: true
      });
    }

    const installationId = github.installationId;
    const appId = process.env.GITHUB_APP_ID;
    let privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      console.error('Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY');
      return res.status(500).json({ message: 'Server configuration error: Missing GitHub credentials' });
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    if (!privateKey.includes('BEGIN RSA PRIVATE KEY') || privateKey.length < 50) {
      console.error('Invalid GITHUB_PRIVATE_KEY format.');
      return res.status(500).json({ message: 'Server configuration error: Invalid GitHub Private Key format' });
    }

    const { App } = await import('octokit');
    let app;
    try {
      app = new App({ appId, privateKey });
    } catch (err) {
      console.error("Failed to initialize Octokit App:", err.message);
      return res.status(500).json({ message: 'Internal Server Error: Failed to initialize GitHub App' });
    }

    let octokit;
    const numericInstallationId = parseInt(installationId, 10);
    if (isNaN(numericInstallationId)) {
      console.error(`Invalid installationId format: ${installationId}`);
      await disconnectGithub(uid);
      return res.status(400).json({ message: 'Invalid GitHub installation ID. Please reinstall the app.', notInstalled: true });
    }

    try {
      octokit = await app.getInstallationOctokit(numericInstallationId);
    } catch (err) {
      console.error(`Failed to get installation octokit for ID ${installationId}:`, err.message);
      if (err.status === 404 || err.status === 401) {
        await disconnectGithub(uid);
        return res.status(404).json({ message: 'GitHub App installation not found. Please reinstall.', notInstalled: true });
      }
      throw err;
    }

    try {
      const response = await octokit.request('GET /installation/repositories', { per_page: 100 });

      const repos = response.data.repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        owner: repo.owner.login,
        html_url: repo.html_url
      }));

      res.json(repos);
    } catch (requestErr) {
      console.error("Error fetching repositories from GitHub:", requestErr.message);
      await disconnectGithub(uid, { installationId: null });
      const status = requestErr.status || requestErr.response?.status;
      if (status === 404) {
        return res.status(400).json({ message: 'GitHub App installation not found. Please reinstall.', notInstalled: true });
      }
      if (status === 401 || status === 403) {
        return res.status(401).json({ message: 'GitHub App authentication failed.', notInstalled: true });
      }
      return res.status(500).json({ message: 'Failed to fetch repositories. Please reinstall.', notInstalled: true });
    }

  } catch (error) {
    console.error('Error fetching installation repos:', error);
    if (req.user?.uid) {
      await disconnectGithub(req.user.uid, { installationId: null });
    }
    res.status(500).json({
      message: 'Failed to fetch repositories. Please reinstall.',
      notInstalled: true,
      error: error.message
    });
  }
});

// GET /stats - Fetch GitHub user stats
router.get('/stats', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const github = user?.githubIntegration;

    if (!user || !github?.connected || !github?.accessToken) {
      return res.json({ connected: false, message: 'GitHub account not connected' });
    }

    const accessToken = decryptToken(github.accessToken);
    const username = github.username;

    const userResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    res.json({
      login: userResponse.data.login,
      name: userResponse.data.name,
      avatar_url: userResponse.data.avatar_url,
      bio: userResponse.data.bio,
      public_repos: userResponse.data.public_repos,
      followers: userResponse.data.followers,
      following: userResponse.data.following,
      created_at: userResponse.data.created_at,
      html_url: userResponse.data.html_url
    });
  } catch (error) {
    console.error('Error fetching GitHub stats:', error.message);
    res.status(500).json({ message: 'Failed to fetch GitHub stats' });
  }
});

// GET /events - Fetch recent GitHub events/activity
router.get('/events', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const github = user?.githubIntegration;

    if (!user || !github?.connected || !github?.accessToken) {
      return res.json({ connected: false, message: 'GitHub account not connected' });
    }

    const accessToken = decryptToken(github.accessToken);
    const username = github.username;

    const eventsResponse = await axios.get(`https://api.github.com/users/${username}/events?per_page=30`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const events = eventsResponse.data.map(event => ({
      id: event.id,
      type: event.type,
      repo: event.repo.name,
      created_at: event.created_at,
      payload: {
        action: event.payload?.action,
        ref: event.payload?.ref,
        commits: event.payload?.commits?.slice(0, 3)?.map(c => ({
          sha: c.sha?.substring(0, 7),
          message: c.message?.substring(0, 80)
        }))
      }
    }));

    res.json(events);
  } catch (error) {
    console.error('Error fetching GitHub events:', error.message);
    res.status(500).json({ message: 'Failed to fetch GitHub events' });
  }
});

// GET /contributions - Fetch contribution data
router.get('/contributions', verifyToken, async (req, res) => {
  const uid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const github = user?.githubIntegration;

    if (!user || !github?.connected || !github?.accessToken) {
      return res.json({ connected: false, message: 'GitHub account not connected' });
    }

    const accessToken = decryptToken(github.accessToken);
    const username = github.username;

    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
        }
      }
    `;

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const from = new Date(`${year}-01-01T00:00:00Z`).toISOString();
    const to = new Date(`${year}-12-31T23:59:59Z`).toISOString();

    const graphqlResponse = await axios.post(
      'https://api.github.com/graphql',
      { query, variables: { username, from, to } },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (graphqlResponse.data.errors) {
      console.error('GraphQL Errors:', graphqlResponse.data.errors);
      throw new Error('GraphQL Error');
    }

    const calendar = graphqlResponse.data.data.user.contributionsCollection.contributionCalendar;

    const contributions = [];
    calendar.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        contributions.push({
          date: day.date,
          count: day.contributionCount,
          level: 0
        });
      });
    });

    res.json(contributions);
  } catch (error) {
    console.error('Error fetching contributions:', error.message);
    res.status(500).json({ message: 'Failed to fetch contribution data' });
  }
});

// GET /readme - Fetch README content for a repository
router.get('/readme', verifyToken, async (req, res) => {
  const { owner, repo } = req.query;
  const uid = req.user.uid;

  if (!owner || !repo) {
    return res.status(400).json({ message: 'Owner and repo are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    const github = user?.githubIntegration;

    if (!user || !github?.connected || !github?.installationId) {
      return res.status(400).json({ message: 'GitHub App not installed' });
    }

    const installationId = github.installationId;
    const appId = process.env.GITHUB_APP_ID;
    let privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

    const { App } = await import('octokit');
    const app = new App({ appId, privateKey });
    const octokit = await app.getInstallationOctokit(parseInt(installationId));

    try {
      const response = await octokit.request('GET /repos/{owner}/{repo}/readme', {
        owner,
        repo,
        mediaType: { format: 'raw' }
      });
      res.send(response.data);
    } catch (err) {
      if (err.status === 404) {
        return res.send("# No README found");
      }
      throw err;
    }

  } catch (error) {
    console.error('Error fetching README:', error);
    res.status(500).json({ message: 'Failed to fetch README' });
  }
});

module.exports = router;
