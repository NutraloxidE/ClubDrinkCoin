const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { ExpressPeerServer } = require('peer');
const app = express();

// SSL証明書と秘密鍵のパスを指定
const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

// publicディレクトリを静的ファイルのホストとして設定
app.use(express.static(path.join(__dirname, 'public')));

// Enable JSON body parsing
app.use(express.json());

// HTTPSサーバーを作成
const server = https.createServer(options, app);

// PeerJSサーバーを作成
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/clubdrinkcoin'
});

// PeerJSサーバーをエンドポイントとして設定
app.use('/peerjs', peerServer);

// Array to store peer IDs
let peerIds = [];

// Endpoint to add a new peer ID
app.post('/networking/addpeerID', (req, res) => {
  const MAXPEERS = 10;

  const { peerId } = req.body;
  peerIds.push(peerId);

  // If the array length exceeds 10, remove the oldest element
  if (peerIds.length > MAXPEERS) {
    peerIds.shift();
  }

  res.json({ message: 'Peer ID added successfully.' });
});

// End point to remove their own peer ID before closing the tab
app.post('/networking/removepeerID', (req, res) => {
  const { peerId } = req.body;
  const index = peerIds.indexOf(peerId);
  if (index > -1) {
    peerIds.splice(index, 1);
  }
  res.json({ message: 'Peer ID removed successfully.' });
  console.log('Peer ID removed:', peerId);
});

// Endpoint to get all peer IDs
app.get('/networking/getPeerIds', (req, res) => {
  res.json(peerIds);
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});