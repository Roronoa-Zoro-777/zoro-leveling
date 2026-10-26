/**
 * crypto.js — Native Web Crypto API for encrypted backups and PIN authentication
 */

// Hash a 4-digit PIN with a fixed application salt using SHA-256
export async function hashPin(pin) {
  const enc = new TextEncoder();
  const data = enc.encode(`zorolevel-pin-salt-${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive AES-GCM key from user passphrase using PBKDF2
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt payload object into password-protected JSON package
export async function encryptBackup(dataObj, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const enc = new TextEncoder();
  const plainBytes = enc.encode(JSON.stringify(dataObj));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainBytes
  );

  return {
    encrypted: true,
    version: 'aes-gcm-v1',
    salt: Array.from(salt),
    iv: Array.from(iv),
    cipherText: Array.from(new Uint8Array(cipherBuffer)),
  };
}

// Decrypt encrypted backup package using passphrase
export async function decryptBackup(encryptedPkg, passphrase) {
  if (!encryptedPkg?.encrypted || !encryptedPkg.salt || !encryptedPkg.iv || !encryptedPkg.cipherText) {
    throw new Error('Invalid encrypted package format');
  }

  const salt = new Uint8Array(encryptedPkg.salt);
  const iv = new Uint8Array(encryptedPkg.iv);
  const cipherBytes = new Uint8Array(encryptedPkg.cipherText);

  const key = await deriveKey(passphrase, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plainBuffer));
  } catch (err) {
    throw new Error('Incorrect passphrase or corrupted data');
  }
}

// Aliases matching caller signature (passphrase, data)
export const exportEncryptedBackup = (passphrase, dataObj) => encryptBackup(dataObj, passphrase);
export const decryptBackupData = (passphrase, encryptedPkg) => decryptBackup(encryptedPkg, passphrase);

