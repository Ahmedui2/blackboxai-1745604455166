const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const config = require('./config.json');

const router = express.Router();

const clientId = process.env.DISCORD_CLIENT_ID || config.clientId || 'YOUR_DISCORD_CLIENT_ID';
const clientSecret = process.env.DISCORD_CLIENT_SECRET || config.clientSecret || 'YOUR_DISCORD_CLIENT_SECRET';
const redirectUri = process.env.DISCORD_REDIRECT_URI || config.redirectUri || 'http://localhost:3000/oauth/callback';

router.get('/login', (req, res) => {
  const scope = 'identify guilds';
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
  res.redirect(discordAuthUrl);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      scope: 'identify guilds',
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Get user guilds
    const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Store user info and guilds in session
    req.session.user = userResponse.data;
    req.session.guilds = guildsResponse.data;

    // Automatically confirm linking and redirect to dashboard
    res.redirect('/');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
