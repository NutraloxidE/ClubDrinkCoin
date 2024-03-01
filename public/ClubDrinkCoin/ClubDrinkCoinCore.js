/**
 * ClubDrinkCoinCore.js
 * Definition of the ClubDrinkCoinCore class
 */

/**
 * Check if the environment is a browser or Node.js
 */

let crypto;
if (typeof window !== 'undefined') {
  // ブラウザ環境
  crypto = window.crypto;
} else if (typeof global !== 'undefined') {
  // Node.js環境
  const WebCrypto = require('node-webcrypto-ossl');
  crypto = new WebCrypto();
}

/**
 * Key Generation related
 */

async function generateKeyPair() {
  console.log("Generating a public/private key pair...");
  const keyPair = await crypto.subtle.generateKey(
      {
          name: "ECDSA",
          namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
  );
  console.log("Key pair generated.");
  return keyPair;
}

async function signMessage(privateKey, message) {
  console.log(`Signing the message "${message}"...`);
  const msgUint8 = new TextEncoder().encode(message);
  const signature = await window.crypto.subtle.sign(
      {
          name: "ECDSA",
          hash: {name: "SHA-256"},
      },
      privateKey,
      msgUint8
  );
  console.log("Message signed.");
  return new Uint8Array(signature);
}

async function verifySignature(publicKey, message, signature) {
  console.log("Verifying the signature...");
  const msgUint8 = new TextEncoder().encode(message);
  const isValid = await window.crypto.subtle.verify(
      {
          name: "ECDSA",
          hash: {name: "SHA-256"},
      },
      publicKey,
      signature,
      msgUint8
  );
  console.log("Signature verified.");
  return isValid;
}

/**
 * Key Saving and Loading related
 */

export async function GetBase64EncodedPublicKey(key) {
  const exportedKey = await window.crypto.subtle.exportKey("spki", key);
  const keyBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  return keyBase64;
}

export async function GetBase64DecodedPublicKey(base64EncodedKey) {
  const keyBuffer = window.atob(base64EncodedKey);
  const keyArray = new Uint8Array(keyBuffer.length);
  for (let i = 0; i < keyBuffer.length; i++) {
    keyArray[i] = keyBuffer.charCodeAt(i);
  }
  const key = await window.crypto.subtle.importKey(
    "spki",
    keyArray,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
  return key;
}

/**
 * Transaction related
 */

export class Transaction {
  constructor(fromAddress, toAddress, amount, signature, transactionID, timestamp) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.signature = signature;
    this.transactionID = transactionID;
    this.timestamp = timestamp;
  }
}

export function createTransaction(fromAddress, toAddress, amount, signature) {
  const transactionID = generateTransactionID(fromAddress, toAddress, amount, signature);
  const timestamp = new Date().toISOString();

  return new Transaction(fromAddress, toAddress, amount, signature, transactionID, timestamp);
}

export async function generateTransactionID(fromAddress, toAddress, amount, signature) {
  const msgUint8 = new TextEncoder().encode(fromAddress + toAddress + amount + signature);                                  
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);                   
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
  return hashHex;
}

/**
 *  BlockChain related
 */

export class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.transaction;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  async calculateHash() {
    const msgUint8 = new TextEncoder().encode(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data));                                  
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);                   
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
    return hashHex;
  }
}

export class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, "01/01/2021", "Genesis block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = await newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  async isChainValid() {
    for(let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if(currentBlock.hash !== await currentBlock.calculateHash()) {
        return false;
      }

      if(currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

/** 
 *  Component Codes are end here
 *  Main codes from here
 */

//Global variables
export let MyOwnBlockChain = new Blockchain();
window.MyOwnBlockChain = MyOwnBlockChain;
export let MyOwnKeyPair;
window.DEBUGShowMyOwnKeyPair = function () {
  console.log(MyOwnKeyPair);
}

async function main() { 

}

async function keytest(){
  //key generation test
  let doIHaveAKeyPair = false;

  if (doIHaveAKeyPair === false) {
    MyOwnKeyPair = await generateKeyPair();
    doIHaveAKeyPair = true;
  }
  if (doIHaveAKeyPair === true) {
    MyOwnKeyPair = await generateKeyPair();
  }

  //signing and verifying test
  const message = "Hello, world!";
  const signature = await signMessage(MyOwnKeyPair.privateKey, message);
  const isSignatureValid = await verifySignature(MyOwnKeyPair.publicKey, message, signature);
  console.log(`The signature is ${isSignatureValid ? "valid" : "not valid"}.`);

  //show key pair
  console.log(MyOwnKeyPair);

}

async function blocktest() {
  //block cchain test
  MyOwnBlockChain.addBlock(new Block(1, "10/07/2021", { amount: 4 }));
  MyOwnBlockChain.addBlock(new Block(2, "12/07/2021", { amount: 10 }));
  
  console.log(JSON.stringify(MyOwnBlockChain, null, 4));

  const isValid = await MyOwnBlockChain.isChainValid();
  console.log('Blockchain valid?' + isValid);
}

keytest();
main();