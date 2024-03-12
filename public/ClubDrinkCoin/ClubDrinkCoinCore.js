/**
 * ClubDrinkCoinCore.js
 * Definition of the ClubDrinkCoinCore class
 */

/**
 * Check if the environment is a browser or Node.js
 */

import * as networking from './networking.js';

let crypto;
async function initializeCrypto() {
  if (typeof window !== 'undefined' && window.crypto) {
    // ブラウザ環境
    crypto = window.crypto;
  } else if (typeof global !== 'undefined') {
    // Node.js環境
    const WebCrypto = require('node-webcrypto-ossl');
    crypto = new WebCrypto();
  }
}

await initializeCrypto();

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

/**
 * Key Saving and Loading related
 */
export class FullWallet {
  constructor(storedWallet, keyPair) {
    this.storedWallet = storedWallet;
    this.keyPair = keyPair;
    this.balance = 0;
  }

  async getAccurateBalance () {
    // Get the balance from the blockchain
    //TODO: implement this

    throw new error("Not implemented yet");

    return null;
  }

  async getBalance () {
    return this.balance;
  }

  async makeTransactionAndPropaganda(toAddressEncoded, amount, fee, publicNote) {
    // Create a new transaction
    const transaction = await createTransaction(toAddressEncoded, toAddressEncoded, amount, fee, this.keyPair.privateKey, publicNote);

    let isValid = await transaction.isValid();
    if (!isValid) {
      throw new Error("Invalid transaction");
    }

    await MyTransactionPool.push(transaction);
    await MyNetworkManager.propagateTransaction(transaction);

    return transaction;

  }

  static async GetNewFullWallet (walletName, password) {
    const keyPair = await generateKeyPair();

    let tempstoredWallet = new StoredWallet();
    await tempstoredWallet.initialize(walletName, keyPair, password);

    var isValid = await tempstoredWallet.isValid();
    console.log(`is Wallet just got valid? ${isValid ? "valid" : "not valid"}.`);

    return new FullWallet(tempstoredWallet, keyPair);
  }

  static async LoadFullWalletFromStoredWalled (storedWallet, password) {
    let keyPair = {};
    keyPair.privateKey = await GetBase64DecodedPrivateKey(storedWallet.encodedPrivateKey, password);
    keyPair.publicKey = await GetBase64DecodedPublicKey(storedWallet.encodedPublicKey);
    return new FullWallet(storedWallet, keyPair);
  }
}

//its a interface for local and session storage
export class StoredWallet {
  constructor() {
    this.walletName;
    this.encodedPublicKey;
    this.encodedPrivateKey;
    this.version;
    this.WalletCreatedDate; //wallet createddate and
    this.Base64signature; //signature (stored as base64) added
  }

  async initialize (walletName, keyPair, password) {
    // Initialize the wallet, so it can be stored as json
    this.walletName = walletName;
    this.encodedPublicKey = await GetBase64EncodedPublicKey(keyPair.publicKey);
    this.encodedPrivateKey = await GetBase64EncodedPrivateKey(keyPair.privateKey, password);
    this.version = "0.0.1";
    this.WalletCreatedDate = new Date().toISOString();

    //Sign is just prooving the name, version and date of creation; not the private key
    var signature = await signMessage(keyPair.privateKey, this.walletName + this.version + this.WalletCreatedDate);
    this.Base64signature = encodeUint8ArrayToBase64(signature);
  }

  async isValid() {
    // Verify the signature
    const decodedPublickey = await GetBase64DecodedPublicKey(this.encodedPublicKey);
    return await verifySignature(decodedPublickey, this.walletName + this.version + this.WalletCreatedDate, this.getDecodedSignature());
  }
  
  getDecodedSignature() { 
    return decodeBase64ToUint8Array(this.Base64signature);
  }

}

//it check if the password is correct
export async function isPasswordCorrect(base64EncodedKeyAndIv, password) {
  try {
    await GetBase64DecodedPrivateKey(base64EncodedKeyAndIv, password);
    return true;
  } catch (error) {
    return false;
  }
}

// Uint8ArrayをBase64形式の文字列に変換
function encodeUint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Base64形式の文字列をUint8Arrayに変換
function decodeBase64ToUint8Array(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export async function GetBase64EncodedPublicKey(key) {
  const exportedKey = await window.crypto.subtle.exportKey("spki", key);
  const keyBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  return keyBase64;
}

export async function GetBase64DecodedPublicKey(base64EncodedKey) {
  if (!isValidBase64(base64EncodedKey)) {
    throw new Error("Invalid Base64-encoded key");
  }

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

export async function GetBase64EncodedPrivateKey(key, password) {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const exportedKey = await crypto.subtle.exportKey("pkcs8", key);
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(password),
      iterations: 100000,
      hash: "SHA-256",
    },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    ),
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv: iv,
    },
    derivedKey,
    exportedKey
  );
  const keyAndIv = {
    encryptedKey: new Uint8Array(encryptedKey),
    iv: iv,
  };
  const keyAndIvArray = [...keyAndIv.encryptedKey, ...keyAndIv.iv];
  const keyAndIvBase64 = btoa(String.fromCharCode(...keyAndIvArray));
  return keyAndIvBase64;
}

export async function GetBase64DecodedPrivateKey(base64EncodedKeyAndIv, password) {
  const keyAndIvBuffer = atob(base64EncodedKeyAndIv);
  const keyAndIvArray = new Uint8Array(keyAndIvBuffer.length);
  for (let i = 0; i < keyAndIvBuffer.length; i++) {
    keyAndIvArray[i] = keyAndIvBuffer.charCodeAt(i);
  }
  const encryptedKey = keyAndIvArray.slice(0, keyAndIvArray.length - 16);
  const iv = keyAndIvArray.slice(keyAndIvArray.length - 16);
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(password),
      iterations: 100000,
      hash: "SHA-256",
    },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    ),
    { name: "AES-CBC", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      derivedKey,
      encryptedKey
    ),
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"]
  );
  return key;
}

export function isValidBase64(str) {
  const notBase64 = /[^A-Z0-9+\/=]/i;
  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }
  const firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && str[len - 1] === '=');
}


/**
 * Signature related
 */

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
 * Network related
 * is moved to networking.js
 */

/**
 * Transaction class related
 */

export class Transaction {
  constructor(fromAddressEncoded, toAddressEncoded, amount, fee, Base64signature, transactionID, timestamp, publicNote) {
    this.fromAddressEncoded = fromAddressEncoded;
    this.toAddressEncoded = toAddressEncoded;
    this.amount = amount;
    this.fee = fee; // Added fee
    this.Base64signature = Base64signature;
    this.transactionID = transactionID;
    this.timestamp = timestamp;
    this.publicNote = publicNote;
  }

  async getDecodedFromAddress() {
    return await GetBase64DecodedPublicKey(this.fromAddressEncoded);
  }

  async getDecodedToAddress() {
    return await GetBase64DecodedPublicKey(this.toAddressEncoded);
  }

  async getDecodedSignature() {
    return decodeBase64ToUint8Array(this.Base64signature);
  }

  //VerifyTransaction
  async isValid() {
    const decodedFromAddress = await GetBase64DecodedPublicKey(this.fromAddressEncoded);
    const decodedToAddress = await GetBase64DecodedPublicKey(this.toAddressEncoded);

    const transactionDataCombined = decodedFromAddress + decodedToAddress + this.amount + this.fee + this.publicNote + this.transactionID + this.timestamp;
    return await verifySignature(decodedFromAddress, transactionDataCombined, await this.getDecodedSignature());
  }
}

export async function compareTransaction(transaction1, transaction2) {
  return transaction1.transactionID === transaction2.transactionID;
}

export async function createTransaction(fromAddressEncoded, toAddressEncoded, amount, fee, privateKey, publicNote) {
  const timestamp = new Date().toISOString();
  const transactionID = await generateTransactionID(fromAddressEncoded, toAddressEncoded, amount, fee, timestamp);

  const Base64signature = await signTransactionBase64(fromAddressEncoded, toAddressEncoded, amount, fee, privateKey, publicNote, transactionID, timestamp);
  if (!isValidBase64(fromAddressEncoded) || !isValidBase64(toAddressEncoded)) {
    throw new Error("Invalid Base64-encoded key");
  }

  return new Transaction(fromAddressEncoded, toAddressEncoded, amount, fee, Base64signature, transactionID, timestamp, publicNote);
}

async function signTransactionBase64(fromAddressEncoded, toAddressEncoded, amount, fee, privateKey, publicNote, transactionID, timestamp) {
  const decodedFromAddress = await GetBase64DecodedPublicKey(fromAddressEncoded);
  const decodedToAddress = await GetBase64DecodedPublicKey(toAddressEncoded);

  const transactionDataCombined = decodedFromAddress + decodedToAddress + amount + fee + publicNote + transactionID + timestamp;
  const signature = await signMessage(privateKey, transactionDataCombined);

  const Base64signature = encodeUint8ArrayToBase64(signature);
  return Base64signature;
}

export async function generateTransactionID(fromAddressEncoded, toAddressEncoded, amount, fee, signature, timestamp) {

  const msgUint8 = new TextEncoder().encode(fromAddressEncoded + toAddressEncoded + amount+ fee + signature + timestamp);                                  
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
    return new Block(0, "03/02/2024", "Genesis block", "0");
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
const CONST_MAX_PEERS = 5;

export let MyTransactionPool = [];
window.MyTransactionPool = MyTransactionPool;

export let MyNetworkManager = new networking.NetworkManager(CONST_MAX_PEERS);
window.MyNetworkManager = MyNetworkManager;

export let MyOwnBlockChain = new Blockchain();
export let DoIHaveKeyPair = false;
export function setDoIHaveKeyPair (bool) {
  DoIHaveKeyPair = bool;
}

export let MyFullWallet = new FullWallet();
export function getMyFullWallet() {
  return MyFullWallet;
}
export function setMyFullWallet(wallet) { 
  MyFullWallet = wallet;
}

async function main() { 
  
}


/**
 * Test functions
 */

// eslint-disable-next-line
async function transactionTest() {
  console.log("---TEST Creating a new transaction...---");

  // Generate a key pair for the sender
  const senderKeyPair = await generateKeyPair();
  const encodedSenderPublicKey = await GetBase64EncodedPublicKey(senderKeyPair.publicKey);

  // Generate a key pair for the receiver
  const receiverKeyPair = await generateKeyPair();
  const encodedReceiverPublicKey = await GetBase64EncodedPublicKey(receiverKeyPair.publicKey);

  // Create a new transaction from the sender to the receiver
  const transaction = await createTransaction(
    encodedSenderPublicKey, // fromAddress
    encodedReceiverPublicKey, // toAddress
    100, // amount
    10, // fee
    senderKeyPair.privateKey, // privateKey
    "public note" // publicNote
  );

  // Verify the transaction
  const isValid = await transaction.isValid(senderKeyPair.publicKey);

  console.log(`Transaction valid? ${isValid ? "valid" : "not valid"}.`);
  console.log(transaction);
  console.log("---TEST Transaction created.---");
}

// eslint-disable-next-line
async function encodeAndDecodeTest() {
  //key generation test
  let keyPair = await generateKeyPair();
  console.log(keyPair);

  //encode test
  let encodedPrivateKey = await GetBase64EncodedPrivateKey(keyPair.privateKey, "password");
  console.log("encodedprivatekey will be below:");
  console.log(encodedPrivateKey);

  //decode test
  let decodedPrivateKey = await GetBase64DecodedPrivateKey(encodedPrivateKey, "password");
  console.log("decodedprivatekey will be below:");
  console.log(decodedPrivateKey);

  //compare test
  /**
   * 
   */
  console.log("Are they same?");
  const exportedOriginalKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const exportedDecodedKey = await crypto.subtle.exportKey("pkcs8", decodedPrivateKey);
  console.log(ArrayBuffer.isView(exportedOriginalKey));
  console.log(ArrayBuffer.isView(exportedDecodedKey));
  console.log(exportedOriginalKey.byteLength === exportedDecodedKey.byteLength && new Uint8Array(exportedOriginalKey).every((value, index) => value === new Uint8Array(exportedDecodedKey)[index]));
}

// eslint-disable-next-line
async function keytest(){
  //key generation test
  let doIHaveAKeyPair = false;
  let MyOwnKeyPair;

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

// eslint-disable-next-line
async function blocktest() {
  //block cchain test
  MyOwnBlockChain.addBlock(new Block(1, "10/07/2021", { amount: 4 }));
  MyOwnBlockChain.addBlock(new Block(2, "12/07/2021", { amount: 10 }));
  
  console.log(JSON.stringify(MyOwnBlockChain, null, 4));

  const isValid = await MyOwnBlockChain.isChainValid();
  console.log(`Blockchain valid? ${isValid ? "valid" : "not valid"}.`);
}

/**
 * entry point
 */
main();