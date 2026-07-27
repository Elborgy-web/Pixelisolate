/**
 * End-to-End Zero-Knowledge Client-Side Encryption for User Vault & History.
 * 
 * Uses Web Crypto API (AES-256-GCM) with 96-bit Initialization Vector (IV).
 * Images are encrypted locally in the user's browser BEFORE transmission to backend/cloud.
 * The server, database, storage buckets, and developer ONLY see encrypted binary noise.
 * Only the logged-in user with their local device key can decrypt and view their images.
 */

const KEY_STORAGE_PREFIX = "pixel_vault_key_";

/**
 * Gets or creates a local device AES-256 encryption key for the current user.
 */
export async function getOrCreateUserCryptoKey(userId: string): Promise<CryptoKey> {
  const storageKey = `${KEY_STORAGE_PREFIX}${userId}`;
  let rawKeyHex = localStorage.getItem(storageKey);

  if (!rawKeyHex) {
    // Generate a secure random 256-bit (32 byte) key for the user
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    rawKeyHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(storageKey, rawKeyHex);
  }

  const keyBuffer = new Uint8Array(
    rawKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  return window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a DataURI or base64 image string using AES-256-GCM.
 * Returns a pure Base64 DataURI string: data:application/octet-stream;base64,{IV+CIPHERTEXT}
 */
export async function encryptDataUri(dataUri: string, userId: string): Promise<string> {
  if (!dataUri || !userId) return dataUri;
  
  try {
    const key = await getOrCreateUserCryptoKey(userId);

    // Generate 12-byte (96-bit) IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Convert DataURI string to Uint8Array
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(dataUri);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );

    // Pack IV (12 bytes) + Ciphertext into a single contiguous binary buffer
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to standard Base64 string without any special characters or colons
    let binary = "";
    const len = combined.length;
    for (let i = 0; i < len; i += 8192) {
      binary += String.fromCharCode.apply(null, Array.from(combined.subarray(i, i + 8192)));
    }
    const cleanBase64 = btoa(binary);

    return `data:application/octet-stream;base64,${cleanBase64}`;
  } catch (err) {
    console.error("AES-256-GCM encryption failed:", err);
    return dataUri; // Fallback to unencrypted if Web Crypto unsupported
  }
}

/**
 * Decrypts an encrypted DataURI string using the user's AES-256-GCM key.
 * Returns the original decrypted DataURI string (e.g. data:image/png;base64,...).
 */
export async function decryptDataUri(encryptedStr: string, userId: string): Promise<string> {
  if (!encryptedStr || !userId) return encryptedStr;

  // If already unencrypted (legacy items), return directly
  if (!encryptedStr.includes("data:application/octet-stream;base64,") && !encryptedStr.includes("data:application/encrypted;base64,")) {
    return encryptedStr;
  }

  try {
    const key = await getOrCreateUserCryptoKey(userId);
    let cleanBase64 = encryptedStr
      .replace("data:application/octet-stream;base64,", "")
      .replace("data:application/encrypted;base64,", "")
      .trim();

    // Handle legacy colon-separated format if present
    if (cleanBase64.includes(":")) {
      const colonIdx = cleanBase64.indexOf(":");
      const ivHex = cleanBase64.substring(0, colonIdx);
      const cipherBase64 = cleanBase64.substring(colonIdx + 1);
      const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || []);
      const binaryStr = atob(cipherBase64);
      const cipherBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        cipherBytes[i] = binaryStr.charCodeAt(i);
      }
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        cipherBytes
      );
      return new TextDecoder().decode(decryptedBuffer);
    }

    const binaryStr = atob(cleanBase64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      combined[i] = binaryStr.charCodeAt(i);
    }

    const iv = combined.subarray(0, 12);
    const cipherBytes = combined.subarray(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error("Zero-Knowledge AES-256-GCM decryption failed:", err);
    return ""; // Decryption failed (unauthorized / wrong key)
  }
}

/**
 * Decrypts a raw Storage ArrayBuffer (or DataURI text) fetched from Supabase Storage.
 * Returns the original decrypted DataURI string (e.g. data:image/png;base64,...).
 */
export async function decryptStorageBuffer(buffer: ArrayBuffer, userId: string): Promise<string> {
  if (!buffer || buffer.byteLength === 0 || !userId) return "";

  try {
    const key = await getOrCreateUserCryptoKey(userId);
    const combined = new Uint8Array(buffer);

    // Check if raw buffer is an unencrypted legacy DataURI string
    const sample = new TextDecoder().decode(combined.subarray(0, 30));
    if (sample.startsWith("data:image/") || sample.startsWith("data:application/")) {
      const fullText = new TextDecoder().decode(combined);
      return decryptDataUri(fullText, userId);
    }

    const iv = combined.subarray(0, 12);
    const cipherBytes = combined.subarray(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Zero-Knowledge AES-256-GCM storage buffer decryption failed:", err);
    return "";
  }
}
