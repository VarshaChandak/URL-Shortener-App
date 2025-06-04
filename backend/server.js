const express = require('express');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const dbFile = path.join(__dirname, 'urls.json');
let urls = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/shorten', (req, res) => {
  const { longUrl } = req.body;
  if (!isValidUrl(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL' });
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
