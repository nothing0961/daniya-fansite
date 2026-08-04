"use client";

import { deriveKey, encryptAesGcm, decryptAesGcm } from "./crypto";

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

export async function saveSkillMcpConfig(
  sessionToken: string,
  config: SkillMcpSettings,
): Promise<void> {
  try {
    const key = await deriveKey(sessionToken, USER_KEY_ENCRYPTION_SALT);
    if (!key) return;
    const plaintext = JSON.stringify(config);
    const encrypted = await encryptAesGcm(key, plaintext);
    if (!encrypted) return;
    localStorage.setItem(SKILL_MCP_STORAGE_KEY, encrypted);
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
    const key = await deriveKey(sessionToken, USER_KEY_ENCRYPTION_SALT);
    if (!key) return null;
    const plaintext = await decryptAesGcm(key, stored);
    if (!plaintext) return null;
    return JSON.parse(plaintext);
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
