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

}