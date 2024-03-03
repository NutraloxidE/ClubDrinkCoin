import * as ClubDrinkCoinCore from './ClubDrinkCoinCore.js';

/**Key stuff */

export async function InitNewWalletByClicking() {
  const walletName = prompt("Enter wallet name or description:");
  if (walletName == null) { alert("Wallet creation cancelled"); return false; }
  const password = prompt("Enter password (DO NOT LOSE IT YOU CANT CHANGE PASSWORD):");
  if (password == null) { alert("Wallet creation cancelled"); return false; }
  const confirmPW = prompt("Confirm password (!!!DO NOT LOSE IT YOU CANT CHANGE PASSWOR!!!):");
  if (confirmPW == null) { alert("Wallet creation cancelled"); return false; }

  if (password == ""){
    alert("Password cannot be empty");
    return false;
  }

  if (password !== confirmPW) {
    alert("Passwords do not match");
    return false;
  }

  //generate new wallet
  try{

    //generate new wallet
    console.log("Generating new wallet");
    var walletJustGenerated = await ClubDrinkCoinCore.FullWallet.GetNewFullWallet(walletName, password);
    ClubDrinkCoinCore.setMyFullWallet(walletJustGenerated);
    
    //save wallet to local storage
    var tempStoredWallet = walletJustGenerated.storedWallet;
    localStorage.setItem('storedWallet', JSON.stringify(tempStoredWallet));
    console.log("Wallet saved to local storage");

  } catch (e) {
    alert("Error: " + e);
    console.error(e);
    return false;
  }

  let userConfirmed = false
  while (!userConfirmed) {
    userConfirmed = confirm("!!!!!!!!!IMPORTANT!!!!!!!!! \r\n\r\n You gonna download your wallet file now. Keep it safe and do not lose it. You will need it to access your wallet.");
  }
  SaveStoredWalletAsFile(walletJustGenerated.storedWallet);

  ClubDrinkCoinCore.setDoIHaveKeyPair(true);

}

export async function DeleteWalletFromLocalStorage() {

  if (localStorage.getItem('storedWallet') == null) {
    alert("No wallet found in local storage");
    return false;
  }

  let confirmDelete = confirm("Are you sure you want to delete your wallet from local storage?");
  if (!confirmDelete) {
    return false;
  }
  localStorage.removeItem('storedWallet');
  ClubDrinkCoinCore.setMyFullWallet(null);
  alert("Wallet deleted from local storage");
  ClubDrinkCoinCore.setDoIHaveKeyPair(false);
}


export async function ImportWalletFromLocalStorage() {
  let storedWalletJson = JSON.parse(localStorage.getItem('storedWallet'));

  if (storedWalletJson == null) {
    console.log("No wallet found in local storage");
    return false;
  }else{
    console.log("Wallet found in local storage");
  }

  let wallet;

  let password = prompt("Found a wallet on your browser! \r\nEnter password for the wallet:");
  if (password == "") {
    alert("Password cannot be empty");
    return false;
  }

  wallet = await ClubDrinkCoinCore.FullWallet.LoadFullWalletFromStoredWalled(storedWalletJson, password);

  ClubDrinkCoinCore.setMyFullWallet(wallet);
  ClubDrinkCoinCore.setDoIHaveKeyPair(true);
}

export async function ImportWalletByClicking (warning) {
  if(warning) {
    let confirmOverwrite = confirm("Importing wallet will overwrite your current wallet. Are you sure?");
    if (!confirmOverwrite) {
      return false;
    }
  }

  

  // Create a file input element
  let fileInput = document.createElement('input');
  fileInput.type = 'file';

  // Wait for the user to select a file
  let file = await new Promise(resolve => {
    fileInput.onchange = e => {
      let file = e.target.files[0];
      resolve(file);
    };
    fileInput.click();
  });

  // Read the file
  let fileContent = await new Promise(resolve => {
    let reader = new FileReader();
    reader.onload = e => {
      resolve(e.target.result);
    };
    reader.readAsText(file);
  });
  
  let password = prompt("Enter password for the wallet:");
  if (password == ""){
    alert("Password cannot be empty");
    return false;
  }


  let storedWalletJson = JSON.parse(fileContent);
  console.log(storedWalletJson);


  let wallet;
  try{
  wallet = await ClubDrinkCoinCore.FullWallet.LoadFullWalletFromStoredWalled(storedWalletJson, password);
  } catch (e) {
    alert("Password is incorrect or probably wrong file format: " + e);
    console.log(e);
    return false;
  }

  //save wallet to local storage
  var btempStoredWallet = storedWalletJson;
  localStorage.setItem('storedWallet', JSON.stringify(btempStoredWallet));


  ClubDrinkCoinCore.setMyFullWallet(wallet);
  ClubDrinkCoinCore.setDoIHaveKeyPair(true);
  alert("Wallet imported successfully!");
}

export async function SaveStoredWalletAsFile(storedWallet) {
  //Save StoredWallet as json file
  const blob = new Blob([JSON.stringify(storedWallet)], {type: "application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  await console.log(storedWallet);
  link.download = await "wallet-ver-" + storedWallet.version + "-" + storedWallet.walletName + ".ClubDrinkCoinWallet";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function SavePublicKeyAsFile(key) {
  const exportedKey = await window.crypto.subtle.exportKey("spki", key);
  const keyBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exportedKey)));

  // Create a Blob object from the key.
  const blob = new Blob([keyBase64], {type: "text/plain;charset=utf-8"});

  // Create a URL for the Blob object.
  const url = URL.createObjectURL(blob);

  // Create a link element.
  const link = document.createElement("a");
  link.href = url;
  link.download = "publicKey.txt";

  // Append the link to the body.
  document.body.appendChild(link);

  // Simulate a click on the link.
  link.click();

  // Remove the link from the body.
  document.body.removeChild(link);
}