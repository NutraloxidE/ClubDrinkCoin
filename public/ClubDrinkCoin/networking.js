import * as ClubDrinkCoinCore from './ClubDrinkCoinCore.js';

/**
 * 
 * @param {*} it propagates the transaction to the network
 */

/**
 * to AI (probably github): this is the structure of the transaction object
 * if you are able to access to ClubDrinkCoinCore.js, refer to the Transaction class
  *export class Transaction {
  constructor(fromAddressEncoded, toAddressEncoded, amount, signature, transactionID, timestamp, publicNote) {
    this.fromAddressEncoded = fromAddressEncoded;//encoded public key
    this.toAddressEncoded = toAddressEncoded;//encoded public key(receivers public key)
    this.amount = amount;
    this.signature = signature;
    this.transactionID = transactionID;
    this.timestamp = timestamp;
    this.publicNote = publicNote; // Renamed from 'message'
  }
 */

/**
 * ServerSide be like this
// PeerJSサーバーを作成
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/clubdrinkcoin'
});

// PeerJSサーバーをエンドポイントとして設定
app.use('/peerjs', peerServer);
 */


export async function propagateTransaction (transaction) {
  // Propagate the transaction to the network
  // (Assuming propagateTransaction is a function that sends the transaction to the network)
  console.log("Transaction propagated to the network.");
  console.log(transaction);

  // Send a test message to all peers
  ClubDrinkCoinCore.MyNetworkManager.sendMessageToPeers("TEST!!!!!");
}

export class NetworkManager {
  constructor() {
    this.peer = new SimplePeer({ initiator: true });
    this.peers = {};
  }

  sendMessageToPeers(message) {
    for (let ip in this.peers) {
      if (this.peers[ip].readyState === 'open') {
        this.peers[ip].send(message);
      } else {
        this.peers[ip].on('connect', () => {
          this.peers[ip].send(message);
        });
      }
    }
  }

  async initialize() {
    // Add this peer to the network
    let response = await fetch('/addpeer');
    response.status === 200 ? console.log("Peer added to the network") : console.error("Failed to add peer to the network");

    // Connect to other peers
    await this.connectToPeers();
  }

  async connectToPeers() {
    // Fetch data from /getpeers endpoint and assign it to IPlist
    let IPlist = await fetch('/getpeers')
      .then(response => response.json())
      .catch((error) => {
        console.error('Error:', error);
      });

    for (let [ip, timestamp] of Object.entries(IPlist)) {
      console.log(`Connecting to peer at IP: ${ip}, Timestamp: ${timestamp}`);
      
      // Create a new peer connection for each IP in the list
      this.peers[ip] = new SimplePeer({ initiator: true });

      // Handle 'signal' events on the peer connection
      this.peers[ip].on('signal', data => {
        // Send the signal data to the signaling server
        // The signaling server will forward the signal data to the other peer
        this.sendSignal(ip, data);
      });

      // Handle 'connect' events on the peer connection
      this.peers[ip].on('connect', () => {
        console.log(`Connected to peer at IP: ${ip}`);
      });

      // Handle 'data' events on the peer connection
      this.peers[ip].on('data', data => {
        console.log(`Received message from peer at IP: ${ip}: ${data}`);
      });
    }
  }

  async sendSignal(ip, data) {
    // Convert the signal data to a JSON string
    const jsonData = JSON.stringify({ peerIp: ip, signalData: data });

    // Send a POST request to the signaling server
    const response = await fetch('/signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonData
    });

    // Check the response status
    if (response.ok) {
      console.log(`Sent signal data to peer at IP: ${ip}`);
    } else {
      console.error(`Failed to send signal data to peer at IP: ${ip}`);
    }
  }
}