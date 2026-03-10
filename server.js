const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the branded Apple Pay v6 integration page
app.get('/v6', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'v6.html'));
});

// Endpoint for generating client token via OAuth2 client credentials flow
app.get('/web-sdk/demo/api/paypal/browser-safe-client-token', async (_req, res) => {
  try {
    const clientId = 'alc_client1';
    const clientSecret = 'secret';

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Request client token from PayPal OAuth2 endpoint (test environment)
    const response = await fetch('https://www.te-applepayexpresscheckout.qa.paypal.com/web-sdk/demo/api/paypal/browser-safe-client-token');
    const data = await response.json();
    console.log(JSON.stringify(data))

    if (!response.ok) {
      throw new Error(`OAuth2 request failed: ${JSON.stringify(data)}`);
    }

    // Send only the access_token (client_token) to the frontend
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Error fetching client token:', error);
    res.status(500).json({ error: 'Failed to fetch client token' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
