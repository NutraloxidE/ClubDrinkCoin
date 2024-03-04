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

// HTTPSサーバーを作成
const server = https.createServer(options, app);

// PeerJSサーバーを作成
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/clubdrinkcoin'
});

// PeerJSサーバーをエンドポイントとして設定
app.use('/peerjs', peerServer);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});