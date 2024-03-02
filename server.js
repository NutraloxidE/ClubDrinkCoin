const express = require('express');
const path = require('path');
const app = express();

// publicディレクトリを静的ファイルのホストとして設定
app.use(express.static(path.join(__dirname, 'public')));

// Store the peers
let peers = {};

// Add a peer
app.get('/addPeer', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  peers[ip] = Date.now();
  res.sendStatus(200);
});

// Get the list of peers
app.get('/getPeers', (req, res) => {
  res.json(peers);
});

// Remove peers that have not accessed in the last hour
setInterval(() => {
  const now = Date.now();
  for (const ip in peers) {
    if (now - peers[ip] > 3600000) { // 1 hour = 3600000 milliseconds
      delete peers[ip];
    }
  }
}, 60000); // Check every minute

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});