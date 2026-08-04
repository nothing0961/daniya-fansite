"use client";

import { deriveKey, encryptAesGcm, decryptAesGcm } from "./crypto";

export const CUSTOM_AI_CONFIG_STORAGE_KEY = "daniya:ai:config:v1";

const USER_KEY_ENCRYPTION_SALT = "daniya-custom-ai-v1";

export async function saveCustomAiConfig(
  sessionToken: string,
  cfg: { baseURL: string; apiKey: string; model: string; maxTokens?: number },
): Promise<void> {
  try {
    const key = await deriveKey(sessionToken, USER_KEY_ENCRYPTION_SALT);
    if (!key) return;
    const plaintext = JSON.stringify(cfg);
    const encrypted = await encryptAesGcm(key, plaintext);
    if (!encrypted) return;
    localStorage.setItem(CUSTOM_AI_CONFIG_STORAGE_KEY, encrypted);
  } catch {
    return;
  }
}

export async function loadCustomAiConfig(
  sessionToken: string,
): Promise<{ baseURL: string; apiKey: string; model: string; maxTokens?: number } | null> {
  try {
    const stored = localStorage.getItem(CUSTOM_AI_CONFIG_STORAGE_KEY);
    if (!stored) return null;
    const key = await deriveKey(sessionToken, USER_KEY_ENCRYPTION_SALT);
    if (!key) return null;
    const plaintext = await decryptAesGcm(key, stored);
    if (!plaintext) return null;
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}

export function deleteCustomAiConfig(): void {
  try {
    localStorage.removeItem(CUSTOM_AI_CONFIG_STORAGE_KEY);
  } catch {
    return;
  }
}
