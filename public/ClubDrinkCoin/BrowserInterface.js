/**Key stuff */

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