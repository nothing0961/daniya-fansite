export interface SkillParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  parameters: SkillParameter[];
  enabled: boolean;
}

export interface McpServerTool {
  name: string;
  description: string;
  parameters: SkillParameter[];
  enabled: boolean;
}

export interface McpServerConfig {
  id: string;
  name: string;
  baseURL: string;
  apiKey?: string;
  tools: McpServerTool[];
  enabled: boolean;
}

export interface SkillMcpSettings {
  skills: SkillDefinition[];
  mcpServers: McpServerConfig[];
}

export const SKILL_MCP_STORAGE_KEY = "daniya:ai:skillmcp:v1";

const USER_KEY_ENCRYPTION_SALT = "daniya-skillmcp-v1";

function getSubtle(): SubtleCrypto | null {
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

async function deriveKey(sessionToken: string): Promise<CryptoKey | null> {
  const subtle = getSubtle();
  if (!subtle) return null;
  try {
    const salt = new TextEncoder().encode(USER_KEY_ENCRYPTION_SALT);
    const ikm = new TextEncoder().encode(sessionToken);
    const importedKey = await subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
    const derivedKey = await subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info: new Uint8Array(0) },
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

export async function saveSkillMcpConfig(
  sessionToken: string,
  config: SkillMcpSettings,
): Promise<void> {
  try {
    const key = await deriveKey(sessionToken);
    if (!key) return;
    const subtle = getSubtle();
    if (!subtle) return;
    const plaintext = new TextEncoder().encode(JSON.stringify(config));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertextWithTag = await subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertextWithTag)]);
    const storageValue = btoa(String.fromCharCode(...combined));
    localStorage.setItem(SKILL_MCP_STORAGE_KEY, storageValue);
  } catch {
    return;
  }
}

export async function loadSkillMcpConfig(
  sessionToken: string,
): Promise<SkillMcpSettings | null> {
  try {
    const stored = localStorage.getItem(SKILL_MCP_STORAGE_KEY);
    if (!stored) return null;
    const key = await deriveKey(sessionToken);
    if (!key) return null;
    const subtle = getSubtle();
    if (!subtle) return null;
    const decoded = atob(stored);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    const iv = bytes.slice(0, 12);
    const ciphertextWithTag = bytes.slice(12);
    const plaintext = await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertextWithTag);
    const json = new TextDecoder().decode(plaintext);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function deleteSkillMcpConfig(): void {
  try {
    localStorage.removeItem(SKILL_MCP_STORAGE_KEY);
  } catch {
    return;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}