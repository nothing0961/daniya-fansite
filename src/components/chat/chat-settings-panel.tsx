"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  saveCustomAiConfig,
  loadCustomAiConfig,
  deleteCustomAiConfig,
} from "@/lib/custom-ai-config";
import {
  saveSkillMcpConfig,
  loadSkillMcpConfig,
  deleteSkillMcpConfig,
  generateId,
  type SkillDefinition,
  type McpServerConfig,
  type SkillParameter,
  type McpServerTool,
} from "@/lib/skill-mcp-config";

interface ChatSettingsPanelProps {
  onClose: () => void;
  sessionToken: string;
}

export function ChatSettingsPanel({ onClose, sessionToken }: ChatSettingsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"model" | "skills" | "mcp">("model");
  
  const [baseURL, setBaseURL] = React.useState("");
  const [displayKey, setDisplayKey] = React.useState("");
  const [realApiKey, setRealApiKey] = React.useState("");
  const realKeyRef = React.useRef("");
  const [model, setModel] = React.useState("");
  const [maxTokens, setMaxTokens] = React.useState(2000);
  const [settingsErrorMsg, setSettingsErrorMsg] = React.useState("");
  
  const [skills, setSkills] = React.useState<SkillDefinition[]>([]);
  const [mcpServers, setMcpServers] = React.useState<McpServerConfig[]>([]);
  const [skillMcpErrorMsg, setSkillMcpErrorMsg] = React.useState("");
  
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = React.useState("");
  
  const [newSkill, setNewSkill] = React.useState<Omit<SkillDefinition, "id" | "enabled">>({
    name: "",
    description: "",
    parameters: [{ name: "", type: "string" as const, description: "", required: false }],
  });
  const [newMcpServer, setNewMcpServer] = React.useState<Omit<McpServerConfig, "id" | "enabled">>({
    name: "",
    baseURL: "",
    apiKey: "",
    tools: [{ name: "", description: "", parameters: [], enabled: true }],
  });

  const [connectionOk, setConnectionOk] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const cfg = await loadCustomAiConfig(sessionToken);
        if (cfg) {
          setBaseURL(cfg.baseURL);
          setRealApiKey(cfg.apiKey);
          realKeyRef.current = cfg.apiKey;
          if (cfg.apiKey.length >= 8) {
            const s = cfg.apiKey;
            setDisplayKey(s.slice(0, 3) + "*".repeat(Math.max(0, s.length - 8)) + s.slice(-3));
          } else {
            setDisplayKey(cfg.apiKey);
          }
          setModel(cfg.model);
          if (cfg.maxTokens !== undefined) setMaxTokens(cfg.maxTokens);
        }
      } catch { /* noop */ }

      try {
        const skillMcpCfg = await loadSkillMcpConfig(sessionToken);
        if (skillMcpCfg) {
          setSkills(skillMcpCfg.skills ?? []);
          setMcpServers(skillMcpCfg.mcpServers ?? []);
        }
      } catch { /* noop */ }
    })();
  }, [sessionToken]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    realKeyRef.current = e.target.value;
    setRealApiKey(e.target.value);
    setDisplayKey(e.target.value);
  };

  const handleApiKeyBlur = () => {
    const s = realKeyRef.current;
    if (s.length >= 8) {
      setDisplayKey(s.slice(0, 3) + "*".repeat(Math.max(0, s.length - 8)) + s.slice(-3));
    } else {
      setDisplayKey(s);
    }
  };

  const handleApiKeyFocus = () => {
    setDisplayKey("");
  };

  const handleSaveModelConfig = async () => {
    try {
      if (!baseURL.trim() || !realApiKey.trim() || !model.trim()) {
        setSettingsErrorMsg("必填项不完整：请填写 API 地址、API Key、模型名");
        return;
      }
      if (!/^https?:\/\//i.test(baseURL)) {
        setSettingsErrorMsg("API 地址格式错误：必须以 http:// 或 https:// 开头");
        return;
      }

      await saveCustomAiConfig(sessionToken, {
        baseURL: baseURL.trim(),
        apiKey: realApiKey.trim(),
        model: model.trim(),
        maxTokens,
      });
      setSettingsErrorMsg("");
      setUploadStatus("success");
      setUploadMessage("模型配置保存成功！");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch {
      setSettingsErrorMsg("保存失败，请稍后重试");
    }
  };

  const handleClearModelConfig = async () => {
    try {
      await deleteCustomAiConfig();
      setBaseURL("");
      setDisplayKey("");
      setRealApiKey("");
      realKeyRef.current = "";
      setModel("");
      setMaxTokens(2000);
      setConnectionOk(false);
      setSettingsErrorMsg("");
    } catch { /* noop */ }
  };

  const handleSaveSkillMcpConfig = async () => {
    try {
      await saveSkillMcpConfig(sessionToken, { skills, mcpServers });
      setSkillMcpErrorMsg("");
      setUploadStatus("success");
      setUploadMessage("配置保存成功！");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch {
      setSkillMcpErrorMsg("保存失败，请稍后重试");
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.name.trim() || !newSkill.description.trim()) {
      setSkillMcpErrorMsg("请填写 skill 名称和描述");
      return;
    }
    const validParams = newSkill.parameters.filter(p => p.name.trim());
    const skill: SkillDefinition = {
      ...newSkill,
      id: generateId(),
      enabled: true,
      parameters: validParams.length > 0 ? validParams : [],
    };
    setSkills(prev => [...prev, skill]);
    setNewSkill({
      name: "",
      description: "",
      parameters: [{ name: "", type: "string" as const, description: "", required: false }],
    });
    setSkillMcpErrorMsg("");
  };

  const handleRemoveSkill = (skillId: string) => {
    setSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleToggleSkill = (skillId: string) => {
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, enabled: !s.enabled } : s));
  };

  const handleAddParameter = () => {
    setNewSkill(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: "", type: "string" as const, description: "", required: false }],
    }));
  };

  const handleUpdateParameter = (index: number, updates: Partial<SkillParameter>) => {
    setNewSkill(prev => ({
      ...prev,
      parameters: prev.parameters.map((p, i) => i === index ? { ...p, ...updates } : p),
    }));
  };

  const handleRemoveParameter = (index: number) => {
    setNewSkill(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  const handleAddMcpServer = () => {
    if (!newMcpServer.name.trim() || !newMcpServer.baseURL.trim()) {
      setSkillMcpErrorMsg("请填写服务器名称和地址");
      return;
    }
    const validTools = newMcpServer.tools.filter(t => t.name.trim());
    const server: McpServerConfig = {
      ...newMcpServer,
      id: generateId(),
      enabled: true,
      tools: validTools.length > 0 ? validTools : [],
    };
    setMcpServers(prev => [...prev, server]);
    setNewMcpServer({
      name: "",
      baseURL: "",
      apiKey: "",
      tools: [{ name: "", description: "", parameters: [], enabled: true }],
    });
    setSkillMcpErrorMsg("");
  };

  const handleRemoveMcpServer = (serverId: string) => {
    setMcpServers(prev => prev.filter(s => s.id !== serverId));
  };

  const handleToggleMcpServer = (serverId: string) => {
    setMcpServers(prev => prev.map(s => s.id === serverId ? { ...s, enabled: !s.enabled } : s));
  };

  const handleAddTool = () => {
    setNewMcpServer(prev => ({
      ...prev,
      tools: [...prev.tools, { name: "", description: "", parameters: [], enabled: true }],
    }));
  };

  const handleUpdateTool = (index: number, updates: Partial<McpServerTool>) => {
    setNewMcpServer(prev => ({
      ...prev,
      tools: prev.tools.map((t, i) => i === index ? { ...t, ...updates } : t),
    }));
  };

  const handleRemoveTool = (index: number) => {
    setNewMcpServer(prev => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  };

  const handleAddToolParameter = (toolIndex: number) => {
    setNewMcpServer(prev => ({
      ...prev,
      tools: prev.tools.map((t, i) => i === toolIndex ? { ...t, parameters: [...t.parameters, { name: "", type: "string" as const, description: "", required: false }] } : t),
    }));
  };

  const handleUpdateToolParameter = (toolIndex: number, paramIndex: number, updates: Partial<SkillParameter>) => {
    setNewMcpServer(prev => ({
      ...prev,
      tools: prev.tools.map((t, i) => i === toolIndex ? { ...t, parameters: t.parameters.map((p, j) => j === paramIndex ? { ...p, ...updates } : p) } : t),
    }));
  };

  const handleRemoveToolParameter = (toolIndex: number, paramIndex: number) => {
    setNewMcpServer(prev => ({
      ...prev,
      tools: prev.tools.map((t, i) => i === toolIndex ? { ...t, parameters: t.parameters.filter((_, j) => j !== paramIndex) } : t),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      setUploadStatus("error");
      setUploadMessage("请上传 ZIP 格式的压缩包");
      setTimeout(() => setUploadStatus("idle"), 3000);
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("正在解析压缩包...");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zipData = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder("utf-8");
      
      const magicNumber = textDecoder.decode(zipData.slice(0, 4));
      if (magicNumber !== "PK\x03\x04") {
        throw new Error("无效的 ZIP 文件");
      }

      const fileList = parseZipFileList(zipData);
      let configData: { skills?: SkillDefinition[]; mcpServers?: McpServerConfig[] } | null = null;

      for (const entry of fileList) {
        if (entry.fileName === "config.json") {
          const content = extractZipEntry(zipData, entry);
          configData = JSON.parse(content);
          break;
        }
      }

      if (!configData) {
        throw new Error("压缩包中未找到 config.json 文件");
      }

      const skillsData = configData.skills as SkillDefinition[] | undefined;
      const mcpServersData = configData.mcpServers as McpServerConfig[] | undefined;
      if (skillsData && Array.isArray(skillsData)) {
        setSkills(prev => [...prev, ...skillsData.map(s => ({ ...s, id: s.id || generateId() }))]);
      }
      if (mcpServersData && Array.isArray(mcpServersData)) {
        setMcpServers(prev => [...prev, ...mcpServersData.map(s => ({ ...s, id: s.id || generateId() }))]);
      }

      await saveSkillMcpConfig(sessionToken, { skills, mcpServers });

      setUploadStatus("success");
      setUploadMessage("配置导入成功！");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err) {
      setUploadStatus("error");
      setUploadMessage(`导入失败：${err instanceof Error ? err.message : "未知错误"}`);
      setTimeout(() => setUploadStatus("idle"), 3000);
    }
  };

  function parseZipFileList(data: Uint8Array): Array<{ fileName: string; localHeaderOffset: number; compressedSize: number; uncompressedSize: number }> {
    const result: Array<{ fileName: string; localHeaderOffset: number; compressedSize: number; uncompressedSize: number }> = [];
    let offset = 0;

    while (offset + 30 <= data.length) {
      const signature = data.slice(offset, offset + 4);
      if (signature[0] !== 0x50 || signature[1] !== 0x4B || signature[2] !== 0x03 || signature[3] !== 0x04) {
        break;
      }

      const fileNameLength = (data[offset + 26] | (data[offset + 27] << 8));
      const extraFieldLength = (data[offset + 28] | (data[offset + 29] << 8));
      const compressedSize = (data[offset + 18] | (data[offset + 19] << 8) | (data[offset + 20] << 16) | (data[offset + 21] << 24));
      const uncompressedSize = (data[offset + 22] | (data[offset + 23] << 8) | (data[offset + 24] << 16) | (data[offset + 25] << 24));
      const fileName = new TextDecoder("utf-8").decode(data.slice(offset + 30, offset + 30 + fileNameLength));

      result.push({ fileName, localHeaderOffset: offset, compressedSize, uncompressedSize });
      offset += 30 + fileNameLength + extraFieldLength + compressedSize;
    }

    return result;
  }

  function extractZipEntry(data: Uint8Array, entry: { localHeaderOffset: number; fileName: string; compressedSize: number; uncompressedSize: number }): string {
    const signature = data.slice(entry.localHeaderOffset, entry.localHeaderOffset + 4);
    if (signature[0] !== 0x50 || signature[1] !== 0x4B || signature[2] !== 0x03 || signature[3] !== 0x04) {
      throw new Error("无效的本地文件头");
    }

    const fileNameLength = (data[entry.localHeaderOffset + 26] | (data[entry.localHeaderOffset + 27] << 8));
    const extraFieldLength = (data[entry.localHeaderOffset + 28] | (data[entry.localHeaderOffset + 29] << 8));
    const compressionMethod = (data[entry.localHeaderOffset + 8] | (data[entry.localHeaderOffset + 9] << 8));
    const dataOffset = entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;

    if (compressionMethod === 0) {
      return new TextDecoder("utf-8").decode(data.slice(dataOffset, dataOffset + entry.uncompressedSize));
    } else {
      throw new Error("不支持压缩格式，请使用未压缩的 ZIP 文件");
    }
  }

  const handleTestConnection = async () => {
    setConnectionOk(false);
    try {
      const testUrl = baseURL || "https://api.example.com/v1/chat/completions";
      const fullUrl = testUrl.endsWith("/chat/completions") ? testUrl : testUrl.replace(/\/?$/, "/chat/completions");
      const resp = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: realApiKey ? `Bearer ${realApiKey}` : "",
        },
        body: JSON.stringify({
          model: model || "test-model",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });
      let data: any = null;
      try { data = await resp.json(); } catch { /* noop */ }

      if (resp.ok && data && data.object === "chat.completion" && Array.isArray(data.choices)) {
        setConnectionOk(true);
      } else {
        setSettingsErrorMsg("连接失败：模型不兼容 OpenAI 协议或配置有误");
      }
    } catch {
      setSettingsErrorMsg("网络连接失败，请检查地址或稍后重试");
    }
  };

  return (
    <div className="w-80 shrink-0 border-l border-[var(--border)] bg-[var(--background)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h2 className="font-semibold text-[var(--foreground)]">设置</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Button>
      </div>

      <div className="flex border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("model")}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            activeTab === "model"
              ? "bg-[var(--primary)]/20 text-[var(--foreground)] border-b-2 border-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          )}
        >
          模型设置
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("skills")}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            activeTab === "skills"
              ? "bg-[var(--primary)]/20 text-[var(--foreground)] border-b-2 border-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          )}
        >
          Skill
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("mcp")}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            activeTab === "mcp"
              ? "bg-[var(--primary)]/20 text-[var(--foreground)] border-b-2 border-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          )}
        >
          MCP
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {(settingsErrorMsg || skillMcpErrorMsg) && (
          <div className="mb-4 px-3 py-2 text-sm rounded border bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60">
            {settingsErrorMsg || skillMcpErrorMsg}
          </div>
        )}

        {uploadStatus !== "idle" && (
          <div className={cn(
            "mb-4 px-3 py-2 text-sm rounded border",
            uploadStatus === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
              : uploadStatus === "error"
              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60"
              : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30"
          )}>
            {uploadStatus === "uploading" && (
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 animate-spin mr-2" />
            )}
            {uploadMessage}
          </div>
        )}

        {activeTab === "model" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] block mb-1.5">API 地址</label>
              <Input
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://api.deepseek.com/v1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] block mb-1.5">API Key</label>
              <Input
                value={displayKey}
                onChange={handleApiKeyChange}
                onBlur={handleApiKeyBlur}
                onFocus={handleApiKeyFocus}
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] block mb-1.5">模型名</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="deepseek-v4-flash / glm-4.7-flash / ..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] block mb-1.5">
                最大输出 Token <span className="text-[var(--muted-foreground)] font-normal">（默认 2000，最大 4096）</span>
              </label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2000)}
                placeholder="2000"
              />
            </div>

            {connectionOk && (
              <div className="px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm">
                ✅ 连接测试成功！模型兼容 OpenAI 协议。
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestConnection} className="flex-1">连接测试</Button>
              <Button variant="outline" onClick={handleClearModelConfig} className="flex-1">清除配置</Button>
            </div>
            <Button onClick={handleSaveModelConfig} className="w-full">保存并启用</Button>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-4">
            <div className="border border-[var(--border)] rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">添加新 Skill</h3>
              <div className="space-y-2">
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Skill 名称"
                  className="text-sm"
                />
                <Textarea
                  value={newSkill.description}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Skill 描述"
                  rows={2}
                  className="text-sm"
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--muted-foreground)]">参数</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddParameter} className="h-6 px-2">+ 添加参数</Button>
                  </div>
                  {newSkill.parameters.map((param, index) => (
                    <div key={index} className="flex gap-1 mb-1">
                      <Input
                        value={param.name}
                        onChange={(e) => handleUpdateParameter(index, { name: e.target.value })}
                        placeholder="参数名"
                        className="text-xs flex-1"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => handleUpdateParameter(index, { type: e.target.value as SkillParameter["type"] })}
                        className="px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="array">array</option>
                        <option value="object">object</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => handleUpdateParameter(index, { required: e.target.checked })}
                        />
                        必填
                      </label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveParameter(index)} className="h-6 w-6">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={handleAddSkill} className="w-full mt-2">添加 Skill</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">已添加的 Skill ({skills.length})</h3>
              {skills.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)] py-3 text-center">暂无 Skill</div>
              ) : (
                <div className="space-y-2">
                  {skills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-2 rounded border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            skill.enabled ? "bg-emerald-500/20 text-emerald-600" : "bg-gray-500/20 text-gray-600"
                          )}>
                            {skill.enabled ? "启用" : "禁用"}
                          </span>
                          <span className="font-medium text-sm truncate">{skill.name}</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{skill.description}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleToggleSkill(skill.id)} className="h-6 w-6">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {skill.enabled ? (
                              <path d="M12 2a10 10 0 1 0 10 10H2" />
                            ) : (
                              <circle cx="12" cy="12" r="4" />
                            )}
                          </svg>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSkill(skill.id)} className="h-6 w-6">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">导入配置</h3>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">上传包含 config.json 的 ZIP 压缩包</p>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                className="hidden"
                id="skill-settings-upload"
              />
              <label htmlFor="skill-settings-upload" className="flex items-center justify-center gap-2 px-3 py-2 border border-[var(--border)] rounded-md cursor-pointer hover:bg-[var(--muted)] transition-colors text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                上传 ZIP
              </label>
            </div>

            <Button onClick={handleSaveSkillMcpConfig} className="w-full">保存配置</Button>
          </div>
        )}

        {activeTab === "mcp" && (
          <div className="space-y-4">
            <div className="border border-[var(--border)] rounded-lg p-3">
              <h3 className="text-sm font-medium mb-2">添加 MCP 服务器</h3>
              <div className="space-y-2">
                <Input
                  value={newMcpServer.name}
                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="服务器名称"
                  className="text-sm"
                />
                <Input
                  value={newMcpServer.baseURL}
                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, baseURL: e.target.value }))}
                  placeholder="服务器地址"
                  className="text-sm"
                />
                <Input
                  value={newMcpServer.apiKey}
                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API Key（可选）"
                  className="text-sm"
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--muted-foreground)]">工具</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddTool} className="h-6 px-2">+ 添加工具</Button>
                  </div>
                  {newMcpServer.tools.map((tool, toolIndex) => (
                    <div key={toolIndex} className="p-2 rounded border border-[var(--border)] mb-1">
                      <div className="flex gap-1 mb-1">
                        <Input
                          value={tool.name}
                          onChange={(e) => handleUpdateTool(toolIndex, { name: e.target.value })}
                          placeholder="工具名称"
                          className="text-xs flex-1"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTool(toolIndex)} className="h-6 w-6">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </Button>
                      </div>
                      <Textarea
                        value={tool.description}
                        onChange={(e) => handleUpdateTool(toolIndex, { description: e.target.value })}
                        placeholder="工具描述"
                        rows={1}
                        className="text-xs"
                      />
                      <div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-[var(--muted-foreground)]">参数</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleAddToolParameter(toolIndex)} className="h-5 px-2">+ 参数</Button>
                        </div>
                        {tool.parameters.map((param, paramIndex) => (
                          <div key={paramIndex} className="flex gap-1 mt-1">
                            <Input
                              value={param.name}
                              onChange={(e) => handleUpdateToolParameter(toolIndex, paramIndex, { name: e.target.value })}
                              placeholder="参数名"
                              className="text-xs flex-1"
                            />
                            <select
                              value={param.type}
                              onChange={(e) => handleUpdateToolParameter(toolIndex, paramIndex, { type: e.target.value as SkillParameter["type"] })}
                              className="px-2 py-0.5 text-xs border border-[var(--border)] rounded bg-[var(--background)]"
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="array">array</option>
                              <option value="object">object</option>
                            </select>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveToolParameter(toolIndex, paramIndex)} className="h-5 w-5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={handleAddMcpServer} className="w-full mt-2">添加服务器</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">已添加的 MCP 服务器 ({mcpServers.length})</h3>
              {mcpServers.length === 0 ? (
                <div className="text-sm text-[var(--muted-foreground)] py-3 text-center">暂无 MCP 服务器</div>
              ) : (
                <div className="space-y-2">
                  {mcpServers.map(server => (
                    <div key={server.id} className="flex items-center justify-between p-2 rounded border border-[var(--border)]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            server.enabled ? "bg-emerald-500/20 text-emerald-600" : "bg-gray-500/20 text-gray-600"
                          )}>
                            {server.enabled ? "启用" : "禁用"}
                          </span>
                          <span className="font-medium text-sm truncate">{server.name}</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{server.baseURL}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleToggleMcpServer(server.id)} className="h-6 w-6">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {server.enabled ? (
                              <path d="M12 2a10 10 0 1 0 10 10H2" />
                            ) : (
                              <circle cx="12" cy="12" r="4" />
                            )}
                          </svg>
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMcpServer(server.id)} className="h-6 w-6">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">导入配置</h3>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">上传包含 config.json 的 ZIP 压缩包</p>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                className="hidden"
                id="mcp-settings-upload"
              />
              <label htmlFor="mcp-settings-upload" className="flex items-center justify-center gap-2 px-3 py-2 border border-[var(--border)] rounded-md cursor-pointer hover:bg-[var(--muted)] transition-colors text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                上传 ZIP
              </label>
            </div>

            <Button onClick={handleSaveSkillMcpConfig} className="w-full">保存配置</Button>
          </div>
        )}
      </div>
    </div>
  );
}