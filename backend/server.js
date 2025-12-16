const express = require('express');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // <--- 1. Added Axios here
const app = express();
const PORT = 3000;

// --- SECURITY CONFIGURATION ---
/// NEW WAY (SECURE) ✅
require('dotenv').config(); // Load the secret file
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SAFE_BROWSING_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_API_KEY}`;

// --- DATABASE SETUP ---
const dbFile = path.join(__dirname, 'urls.json');
let urls = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- SECURITY FUNCTION ---
// 2. This function checks if the URL is a virus/phishing site
async function checkUrlSafety(urlToCheck) {
  const requestBody = {
    client: {
      clientId: "url-shortener-app",
      clientVersion: "1.0.0"
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [ { url: urlToCheck } ]
    }
  };

  try {
    const response = await axios.post(SAFE_BROWSING_URL, requestBody);
    // If "matches" exists, it means Google found a threat
    if (response.data && response.data.matches) {
      return false; // ❌ UNSAFE
    }
    return true; // ✅ SAFE
  } catch (error) {
    console.error("Google API Error:", error.message);
    return true; // If API fails, we default to allowing it (or you can block it)
  }
}

// --- ROUTES ---

// 3. Made this route ASYNC to wait for the check
app.post('/shorten', async (req, res) => {
  const { longUrl } = req.body;

  if (!isValidUrl(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // 4. PERFORM SECURITY CHECK BEFORE SAVING
  const isSafe = await checkUrlSafety(longUrl);
  if (isSafe === false) {
    return res.status(400).json({ 
      error: '🚫 UNSAFE URL DETECTED! We cannot shorten malicious links.' 
    });
  }

  const existingId = Object.keys(urls).find(id => urls[id] === longUrl);
  if (existingId) {
    return res.json({ shortUrl: `http://localhost:${PORT}/${existingId}` });
  }

  const id = nanoid(6);
  urls[id] = longUrl;
  fs.writeFileSync(dbFile, JSON.stringify(urls, null, 2));
  res.json({ shortUrl: `http://localhost:${PORT}/${id}` });
});

app.get('/:id', (req, res) => {
  const longUrl = urls[req.params.id];
  if (longUrl) {
    res.redirect(longUrl);
  } else {
    res.status(404).send('<h1 style="color:#b2b7ff; text-align:center; margin-top:50px;">404 - URL Not Found</h1>');
  }
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

app.listen(PORT, () => console.log(`✅ Running at http://localhost:${PORT}`));