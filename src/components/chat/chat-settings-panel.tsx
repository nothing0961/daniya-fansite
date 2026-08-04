"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
  open: boolean;
}

export function ChatSettingsPanel({ onClose, sessionToken, open }: ChatSettingsPanelProps) {
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
      toast.success("模型配置保存成功");
    } catch {
      setSettingsErrorMsg("");
      toast.error("保存失败，请稍后重试");
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
      toast.success("配置保存成功");
    } catch {
      setSkillMcpErrorMsg("");
      toast.error("保存失败，请稍后重试");
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
      toast.error("请上传 ZIP 格式的压缩包");
      return;
    }

    const MAX_ZIP_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_ZIP_SIZE) {
      toast.error(`压缩包大小不能超过 ${MAX_ZIP_SIZE / 1024 / 1024}MB`);
      return;
    }

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

      if (typeof configData !== "object" || configData === null) {
        throw new Error("config.json 格式不正确");
      }

      const skillsData = configData.skills;
      const mcpServersData = configData.mcpServers;

      if (skillsData !== undefined && !Array.isArray(skillsData)) {
        throw new Error("skills 必须是数组格式");
      }
      if (mcpServersData !== undefined && !Array.isArray(mcpServersData)) {
        throw new Error("mcpServers 必须是数组格式");
      }

      if (skillsData && Array.isArray(skillsData)) {
        for (const skill of skillsData) {
          if (typeof skill !== "object" || skill === null || !skill.name || typeof skill.name !== "string") {
            throw new Error("skills 中包含无效的 skill 对象");
          }
        }
        setSkills(prev => [...prev, ...skillsData.map(s => ({ ...s, id: s.id || generateId() }))]);
      }
      if (mcpServersData && Array.isArray(mcpServersData)) {
        for (const server of mcpServersData) {
          if (typeof server !== "object" || server === null || !server.name || typeof server.name !== "string") {
            throw new Error("mcpServers 中包含无效的服务器对象");
          }
        }
        setMcpServers(prev => [...prev, ...mcpServersData.map(s => ({ ...s, id: s.id || generateId() }))]);
      }

      await saveSkillMcpConfig(sessionToken, { skills, mcpServers });

      toast.success("配置导入成功");
    } catch (err) {
      toast.error(`导入失败：${err instanceof Error ? err.message : "未知错误"}`);
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

  // 保存按钮的渐变样式
  const saveButtonClassName =
    "w-full bg-gradient-to-r from-[var(--hp-gold)] to-[var(--hp-gold-deep)] text-[#1a0a14] hover:opacity-90";

  return (
    <div className={cn("chat-settings", open && "chat-settings--open")}>
      <div className="chat-settings-header">
        <h2 className="chat-settings-title">设置</h2>
        <button type="button" onClick={onClose} className="chat-icon-btn" aria-label="关闭">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <Tabs defaultValue="model" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model">模型设置</TabsTrigger>
            <TabsTrigger value="skills">Skill</TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>
        </div>

        <div className="chat-settings-body">
          {(settingsErrorMsg || skillMcpErrorMsg) && (
            <div className="mb-4 px-3 py-2 text-sm rounded-md bg-[rgba(212,120,154,0.1)] border border-[rgba(212,120,154,0.3)] text-[var(--hp-pink)]">
              {settingsErrorMsg || skillMcpErrorMsg}
            </div>
          )}

          {/* 模型设置 */}
          <TabsContent value="model" className="space-y-4 mt-0">
            <div>
              <Label className="chat-form-label">API 地址</Label>
              <Input
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://api.deepseek.com/v1"
                className={cn("chat-form-input")}
              />
            </div>
            <div>
              <Label className="chat-form-label">API Key</Label>
              <Input
                value={displayKey}
                onChange={handleApiKeyChange}
                onBlur={handleApiKeyBlur}
                onFocus={handleApiKeyFocus}
                placeholder="sk-..."
                className={cn("chat-form-input")}
              />
            </div>
            <div>
              <Label className="chat-form-label">模型名</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="deepseek-v4-flash / glm-4.7-flash / ..."
                className={cn("chat-form-input")}
              />
            </div>
            <div>
              <Label className="chat-form-label">
                最大输出 Token
                <span style={{ color: "var(--hp-ink-faint)", fontWeight: 400 }}>（默认 2000，最大 4096）</span>
              </Label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2000)}
                placeholder="2000"
                className={cn("chat-form-input")}
              />
            </div>

            {connectionOk && (
              <div
                className="px-3 py-2 rounded-md text-sm"
                style={{
                  background: "rgba(138, 200, 144, 0.1)",
                  border: "1px solid rgba(138, 200, 144, 0.3)",
                  color: "#8ac890",
                }}
              >
                ✅ 连接测试成功！模型兼容 OpenAI 协议。
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestConnection} className="flex-1">连接测试</Button>
              <Button variant="outline" onClick={handleClearModelConfig} className="flex-1">清除配置</Button>
            </div>
            <Button onClick={handleSaveModelConfig} className={saveButtonClassName}>保存并启用</Button>
          </TabsContent>

          {/* Skill 设置 */}
          <TabsContent value="skills" className="space-y-4 mt-0">
            <div className="chat-card rounded-lg p-3">
              <h3 className="chat-settings-section-title">添加新 Skill</h3>
              <div className="space-y-2">
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Skill 名称"
                  className={cn("chat-form-input")}
                />
                <Textarea
                  value={newSkill.description}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Skill 描述"
                  rows={2}
                  className={cn("chat-form-input", "min-h-[60px] resize-none")}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="chat-form-hint">参数</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddParameter} className="h-6 px-2 text-xs">+ 添加参数</Button>
                  </div>
                  {newSkill.parameters.map((param, index) => (
                    <div key={index} className="flex gap-1 mb-1 items-center">
                      <Input
                        value={param.name}
                        onChange={(e) => handleUpdateParameter(index, { name: e.target.value })}
                        placeholder="参数名"
                        className={cn("chat-form-input", "text-xs flex-1 h-7")}
                      />
                      <Select
                        value={param.type}
                        onValueChange={(val) => handleUpdateParameter(index, { type: val as SkillParameter["type"] })}
                      >
                        <SelectTrigger className="h-7 w-[90px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">string</SelectItem>
                          <SelectItem value="number">number</SelectItem>
                          <SelectItem value="boolean">boolean</SelectItem>
                          <SelectItem value="array">array</SelectItem>
                          <SelectItem value="object">object</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={param.required}
                          onCheckedChange={(checked) => handleUpdateParameter(index, { required: checked })}
                        />
                        <span className="text-xs" style={{ color: "var(--hp-ink-soft)" }}>必填</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParameter(index)}
                        className="chat-icon-btn"
                        style={{ width: "1.5rem", height: "1.5rem" }}
                        aria-label="删除参数"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={handleAddSkill} className="w-full mt-2">添加 Skill</Button>
              </div>
            </div>

            <div>
              <h3 className="chat-settings-section-title">已添加的 Skill ({skills.length})</h3>
              {skills.length === 0 ? (
                <div className="chat-form-hint py-3 text-center">暂无 Skill</div>
              ) : (
                <div className="space-y-2">
                  {skills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-2 rounded chat-card">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block" style={{ color: "var(--hp-ink)" }}>
                          {skill.name}
                        </span>
                        <p className="chat-form-hint truncate">{skill.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={skill.enabled}
                          onCheckedChange={() => handleToggleSkill(skill.id)}
                          aria-label="启用/禁用 Skill"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="chat-icon-btn"
                          style={{ width: "1.5rem", height: "1.5rem" }}
                          aria-label="删除 Skill"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="chat-settings-section-title">导入配置</h3>
              <p className="chat-form-hint mb-2">上传包含 config.json 的 ZIP 压缩包</p>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                className="hidden"
                id="skill-settings-upload"
              />
              <label
                htmlFor="skill-settings-upload"
                className="chat-card flex items-center justify-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-opacity hover:opacity-80"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                上传 ZIP
              </label>
            </div>

            <Button onClick={handleSaveSkillMcpConfig} className={saveButtonClassName}>保存配置</Button>
          </TabsContent>

          {/* MCP 设置 */}
          <TabsContent value="mcp" className="space-y-4 mt-0">
            <div className="chat-card rounded-lg p-3">
              <h3 className="chat-settings-section-title">添加 MCP 服务器</h3>
              <div className="space-y-2">
                <Input
                  value={newMcpServer.name}
                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="服务器名称"
                  className={cn("chat-form-input")}
                />
                <Input
                  value={newMcpServer.baseURL}
                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, baseURL: e.target.value }))}
                  placeholder="服务器地址"
                  className={cn("chat-form-input")}
                />
                <Input
                  value={newMcpServer.apiKey}
                  onChange={(e) => setNewMcpServer(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API Key（可选）"
                  className={cn("chat-form-input")}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="chat-form-hint">工具</span>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddTool} className="h-6 px-2 text-xs">+ 添加工具</Button>
                  </div>
                  {newMcpServer.tools.map((tool, toolIndex) => (
                    <div key={toolIndex} className="chat-card rounded p-2 mb-1">
                      <div className="flex gap-1 mb-1 items-center">
                        <Input
                          value={tool.name}
                          onChange={(e) => handleUpdateTool(toolIndex, { name: e.target.value })}
                          placeholder="工具名称"
                          className={cn("chat-form-input", "text-xs flex-1 h-7")}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTool(toolIndex)}
                          className="chat-icon-btn"
                          style={{ width: "1.5rem", height: "1.5rem" }}
                          aria-label="删除工具"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      <Textarea
                        value={tool.description}
                        onChange={(e) => handleUpdateTool(toolIndex, { description: e.target.value })}
                        placeholder="工具描述"
                        rows={1}
                        className={cn("chat-form-input", "text-xs min-h-[40px] resize-none")}
                      />
                      <div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="chat-form-hint">参数</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleAddToolParameter(toolIndex)} className="h-5 px-2 text-xs">+ 参数</Button>
                        </div>
                        {tool.parameters.map((param, paramIndex) => (
                          <div key={paramIndex} className="flex gap-1 mt-1 items-center">
                            <Input
                              value={param.name}
                              onChange={(e) => handleUpdateToolParameter(toolIndex, paramIndex, { name: e.target.value })}
                              placeholder="参数名"
                              className={cn("chat-form-input", "text-xs flex-1 h-7")}
                            />
                            <Select
                              value={param.type}
                              onValueChange={(val) => handleUpdateToolParameter(toolIndex, paramIndex, { type: val as SkillParameter["type"] })}
                            >
                              <SelectTrigger className="h-7 w-[80px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">string</SelectItem>
                                <SelectItem value="number">number</SelectItem>
                                <SelectItem value="boolean">boolean</SelectItem>
                                <SelectItem value="array">array</SelectItem>
                                <SelectItem value="object">object</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              type="button"
                              onClick={() => handleRemoveToolParameter(toolIndex, paramIndex)}
                              className="chat-icon-btn"
                              style={{ width: "1.25rem", height: "1.25rem" }}
                              aria-label="删除参数"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={handleAddMcpServer} className="w-full mt-2">添加服务器</Button>
              </div>
            </div>

            <div>
              <h3 className="chat-settings-section-title">已添加的 MCP 服务器 ({mcpServers.length})</h3>
              {mcpServers.length === 0 ? (
                <div className="chat-form-hint py-3 text-center">暂无 MCP 服务器</div>
              ) : (
                <div className="space-y-2">
                  {mcpServers.map(server => (
                    <div key={server.id} className="flex items-center justify-between p-2 rounded chat-card">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block" style={{ color: "var(--hp-ink)" }}>
                          {server.name}
                        </span>
                        <p className="chat-form-hint truncate">{server.baseURL}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={server.enabled}
                          onCheckedChange={() => handleToggleMcpServer(server.id)}
                          aria-label="启用/禁用 MCP 服务器"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMcpServer(server.id)}
                          className="chat-icon-btn"
                          style={{ width: "1.5rem", height: "1.5rem" }}
                          aria-label="删除 MCP 服务器"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="chat-settings-section-title">导入配置</h3>
              <p className="chat-form-hint mb-2">上传包含 config.json 的 ZIP 压缩包</p>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileUpload}
                className="hidden"
                id="mcp-settings-upload"
              />
              <label
                htmlFor="mcp-settings-upload"
                className="chat-card flex items-center justify-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-opacity hover:opacity-80"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                上传 ZIP
              </label>
            </div>

            <Button onClick={handleSaveSkillMcpConfig} className={saveButtonClassName}>保存配置</Button>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
