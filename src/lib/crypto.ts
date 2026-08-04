"use client";

/**
 * 共享 AES-GCM-256 加密工具
 * 被 custom-ai-config.ts 和 skill-mcp-config.ts 共用
 */

export function getSubtle(): SubtleCrypto | null {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      return window.crypto.subtle;
    }
    if (typeof crypto !== "undefined" && (crypto as any).subtle) {
      return (crypto as any).subtle;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deriveKey(
  sessionToken: string,
  salt: string,
): Promise<CryptoKey | null> {
  const subtle = getSubtle();
  if (!subtle) return null;
  try {
    const saltBuf = new TextEncoder().encode(salt);
    const ikm = new TextEncoder().encode(sessionToken);
    const importedKey = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
    const derivedKey = await subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt: saltBuf, info: new Uint8Array(0) },
      importedKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    return derivedKey;
  } catch {
    return null;
  }
}

export async function encryptAesGcm(
  key: CryptoKey,
  plaintext: string,
): Promise<string | null> {
  try {
    const subtle = getSubtle();
    if (!subtle) return null;
    const data = new TextEncoder().encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
    return btoa(String.fromCharCode(...combined));
  } catch {
    return null;
  }
}

export async function decryptAesGcm(
  key: CryptoKey,
  stored: string,
): Promise<string | null> {
  try {
    const subtle = getSubtle();
    if (!subtle) return null;
    const decoded = atob(stored);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const plaintext = await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
