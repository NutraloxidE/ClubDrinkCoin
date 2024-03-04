import * as ClubDrinkCoinCore from './ClubDrinkCoinCore.js';

/**
 * 
 * @param {*} it propagates the transaction to the network
 */

/**
 * to AI (probably github): this is the structure of the transaction object
 * if you are able to access to ClubDrinkCoinCore.js, refer to the Transaction class
  export class Transaction {
    constructor(fromAddressEncoded, toAddressEncoded, amount, Base64signature, transactionID, timestamp, publicNote) {
      this.fromAddressEncoded = fromAddressEncoded;//encoded public key
      this.toAddressEncoded = toAddressEncoded;//encoded public key(receivers public key)
      this.amount = amount;
      this.Base64signature = Base64signature;
      this.transactionID = transactionID;
      this.timestamp = timestamp;
      this.publicNote = publicNote; // Renamed from 'message'
    }
 */

/**
 * To AI:ServerSide be like this
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

 */


export class NetworkManager {
  constructor(maxPeers) {
    this.transactionpool = [];
    this.peers = []; // Array to store connected peers
    this.maxPeers = maxPeers; // Maximum number of peers to connect to
    this.peer = new Peer({ host: window.location.hostname, port: 3000, path: '/peerjs/clubdrinkcoin' }); // Create a new PeerJS instance
    
    // When a connection is made, add the peer to the peers array
    this.peer.on('connection', (conn) => {
      if (this.peers.length < this.maxPeers) {
        this.peers.push(conn);
        console.log(`Connected to a new peer: ${conn.peer}`);

        // Set up a handler for when data is received from this peer
        conn.on('data', (data) => {
          this.onDataReceived(data);
        });
      }
    });

    // Register the peer ID with the server
    this.peer.on('open', (id) => {
      fetch('/networking/addpeerID', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ peerId: id }),
      })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch((error) => {
        console.error('Error:', error);
      });
    });


    // Connect to initial peers
    fetch('/networking/getPeerIds')
      .then(response => response.json())
      .then(initialPeerIds => {
        initialPeerIds.forEach(peerId => {
          this.connectToPeer(peerId);
        });
      })
      .catch(error => console.error('Error:', error));


    console.log("NetworkManager initialized.");
  }

  connectToPeer(peerId) {
    if (this.peers.length < this.maxPeers) {
      const conn = this.peer.connect(peerId);

      conn.on('open', () => {
        this.peers.push(conn);
        console.log(`Connected to a new peer: ${conn.peer}`);

        // Set up a handler for when data is received from this peer
        conn.on('data', (data) => {
          this.onDataReceived(data);
        });
      });
    }
  }

  async sendMessageToPeers(message) {
    // Send a message to all peers
    this.peers.forEach((conn) => {
      conn.send(message);
    });
    console.log("Sending message to all peers: " + message);
  }

  async propagateTransaction(transaction) {
    // Propagate the transaction to the network
    this.sendMessageToPeers(transaction);
    console.log("Transaction propagated to the network.");
    console.log(transaction);
  }

  async onDataReceived(data) {
    console.log("Data received from a peer.");
    console.log(data);

    // Check if the data has all the properties of a Transaction
    if (data.fromAddressEncoded && data.toAddressEncoded && data.amount && data.Base64signature && data.transactionID && data.timestamp && data.publicNote) {
      console.log("The data is a transaction.");
      this.onTransactionReceived(data);
    } else {
      console.log("The data is not a transaction.");
      // TODO: Handle other types of data
    }
  }

  async onTransactionReceived(transaction) {
    console.log("Transaction received from a peer.");
    console.log(transaction);

    // TODO: Validate the transaction and add it to the transaction pool if it's valid
  }

}