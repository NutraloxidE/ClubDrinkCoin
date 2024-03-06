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

// Array to store peer IDs
let peerIds = [];

// Endpoint to add a new peer ID
app.post('/networking/addpeerID', (req, res) => {
  const { peerId } = req.body;
  peerIds.push(peerId);
  res.json({ message: 'Peer ID added successfully.' });
});

// Endpoint to get all peer IDs
app.get('/networking/getPeerIds', (req, res) => {
  res.json(peerIds);
});
 */


export class NetworkManager {
  constructor(maxPeers) {
    this.transactionpool = [];
    this.peers = []; // Array to store connected peers
    this.maxPeers = maxPeers; // Maximum number of peers to connect to
    this.peer = new Peer({ host: window.location.hostname, port: 3000, path: '/peerjs/clubdrinkcoin' }); // Create a new PeerJS instance

    // Log PeerJS errors to the console
    this.peer.on('error', (err) => {

      if(err === 'peer-unavailable'){
        return;
      }

      console.error("NETWORK:"+"PeerJS uncought error:", err);
      
    });

    //initialize
    this.peer.on('open', (id) => {
      console.log("NETWORK:"+'My peer ID is: ' + id);

      this.addPeerToServer(id);
      this.updateAndCheckPeers();
    });

    //this triggers when a new peer connects to us
    this.peer.on('connection', (conn) => {
      console.log("NETWORK:"+'New Connection from:', conn.peer);

      //this triggers when a new peer sends us data
      conn.on('data', (data) => {
        this.onDataReceived(data, conn);
      });

      // When the connection is open, add the connection to the peers array
      conn.on('open', () => {
        this.peers.push(conn);
        this.sendMessageToPeers('Hello, new peer!');
      });

      // When the connection is closed, remove the connection from the peers array
      conn.on('close', () => {
        console.log("NETWORK:"+"Connection to peer is closed:", conn.peer);
        const index = this.peers.indexOf(conn);
        if (index > -1) {
          this.peers.splice(index, 1);
        }
      });
    });

    // Run updateAndCheckPeers every 10 seconds
    setInterval(() => {
      this.updateAndCheckPeers();
    }, 5000);

    console.log("NetworkManager initialized.");
  }

  async DEBUG_showPeers() {
    console.log("NETWORK:"+"Connected peers:", this.peers);
  }

  async updateAndCheckPeers() {
    // Get all peer IDs from the server
    const response = await fetch('/networking/getPeerIds');
    const data = await response.json();

    // Connect to each peer
    data.forEach(peerId => {
      // Check if we're already connected to this peer or if the peerId is our own
      if (peerId !== this.peer.id && !this.peers.some(peer => peer.peer === peerId)) {
        // If not, connect to this peer
        const conn = this.peer.connect(peerId);
        if (conn) { // Check if the connection is not undefined
          conn.on('error', (error) => {
            console.log("NETWORK:"+"Error occurred in connection:", error);
          });
    
          conn.on('open', () => {
            // When the connection is open, add the connection to the peers array
            this.peers.push(conn);
    
            console.log("NETWORK:"+"Found a new peer! " + peerId);
          });

          conn.on('data', (data) => {
            this.onDataReceived(data, conn);
          });

        } else {
          console.log("NETWORK:"+"Failed to connect to peer:", peerId);
        }
      }
    });

    // Verify connections to peers and close if not connected
    this.peers.forEach((conn, index) => {
      if (conn) { // Check if the connection is not undefined
        if (data.includes(conn.peer)) {
          conn.on('open', () => {
            conn.send('ping');
          });
          conn.on('error', (error) => {
            conn.close();
            console.log("NETWORK:"+"Closed connection to non-existing peer:", conn.peer);
            this.peers.splice(index, 1); // Remove the connection from the peers array
          });
        } else {
          conn.close();
          console.log("NETWORK:"+"Closed connection to non-existing peer:", conn.peer);
          this.peers.splice(index, 1); // Remove the connection from the peers array
        }
      }
    });
    
    if (this.peers.length > 0) {
      //console.log("NETWORK:"+"Connected peers:", this.peers);
    }

    return data;
  }

  async addPeerToServer(peerId) {
    // Add the peer ID to the server
    const response = await fetch('/networking/addpeerID', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ peerId })
    });

    const data = await response.json();
    console.log(data);
  }

  async sendMessageToPeers(message) {
    // Send the message to all connected peers
    this.peers.forEach(peer => {
      if (peer.open) { // Check if the connection is open
        try {
          peer.send(message);
          console.log("NETWORK:"+"Message sent to peer:", peer.peer); // Log output after sending the message
        } catch (error) {
          console.error("NETWORK:"+"Error occurred while sending message:", error);
        }
      } else {
        console.log("NETWORK:"+"Connection to peer is not open:", peer.peer); // Log output if the connection is not open
      }
    });
  }

  async propagateTransaction(transaction) {
    // Propagate the transaction to the network, receiver triggers onDataReceived
    const transactionJson = JSON.stringify(transaction);
    this.sendMessageToPeers(transactionJson);
    console.log("Transaction propagated to the network.");
  }

  async onDataReceived(data, conn) {
    // Check if the data has all the properties of a Transaction
    try {
      const jsondata = JSON.parse(data);

      if (jsondata.fromAddressEncoded && jsondata.toAddressEncoded && jsondata.amount && jsondata.Base64signature && jsondata.transactionID && jsondata.timestamp && jsondata.publicNote) {
        this.onTransactionReceived(jsondata, conn);
        return
      }

    } catch (error) {

    }

    if (data === 'ping') {
      //do nothing
      return
    }
    else {
      console.log("The data is not a transaction, sender: " + conn.peer);
      console.log(data);
      // TODO: Handle other types of data
      return
    }

  }

  async onTransactionReceived(transaction, conn) {
    console.log("Transaction received from a peer, sender: " + conn.peer);
    console.log(transaction);


    // TODO: Validate the transaction and add it to the transaction pool if it's valid
  }

}