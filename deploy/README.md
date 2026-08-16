# daniya-fansite 服务器部署指南

Docker Compose + Caddy 一键部署。适用于 CentOS / Alibaba Cloud Linux 等 x86_64 服务器。

```
浏览器 ──HTTP:80──> Caddy(反代) ──> Next.js(:3000) ──> Neon PostgreSQL(云端，无需自建)
                        │
                        └── 静态资源: public/背景图片(968MB, 卷挂载) + content/(审核投稿MDX, 卷挂载)
```

---

## 一、服务器准备

### 1. 安装 Docker（root 执行）

```bash
# CentOS / Alibaba Cloud Linux
yum install -y docker
systemctl enable --now docker
docker --version
```

Compose v2 插件（二选一）：

```bash
# 方式 A：yum 安装（若仓库里有）
yum install -y docker-compose-plugin && docker compose version

# 方式 B：独立二进制（GitHub 下载慢时用方式 C）
curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

# 方式 C（推荐）：装宝塔面板 → 软件商店 → 一键安装 Docker 管理器，图形化搞定
```

> 后续命令 `docker compose` 如提示找不到，改用 `docker-compose`（独立二进制），效果一样。

### 2. 放行端口

**云控制台安全组**（阿里云：实例 → 安全组 → 配置规则 → 入方向）：
- 放行 TCP **80**（网站访问）
- 22 端口一般默认已放（SSH）

**系统防火墙**：

```bash
systemctl stop firewalld && systemctl disable firewalld   # 简单粗暴
# 或只放行 80：
# firewall-cmd --permanent --add-port=80/tcp && firewall-cmd --reload
```

### 3. 检查内存（轻量服务器务必看）

`next build` 需要约 1.5~2GB 内存，2G 内存的小机容易 OOM。加 4G swap 保险：

```bash
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 二、传输代码（在你自己电脑上执行）

> 用 Git Bash（本机已有）。一条命令把整个项目传上去，自动排除 node_modules（几百MB）、背景图外的构建产物和密钥。

```bash
cd /c/Users/29942/Desktop/daniya-fansite

tar czf - \
  --exclude=node_modules --exclude=.next --exclude=.git \
  --exclude=.env --exclude=.env.local --exclude=.env.production --exclude=".env*.local" \
  --exclude=logs --exclude=.claude --exclude=.uploads --exclude=tsconfig.tsbuildinfo \
  . | ssh root@你的服务器IP "mkdir -p /var/www/nextjs-app && tar xzf - -C /var/www/nextjs-app"
```

> 968MB 背景图会一起传（走 SSH 加密通道），按网速等几分钟到几十分钟，耐心等命令结束。
> 提示输入密码或配置 SSH 密钥（`ssh-copy-id`）。

---

## 三、配置环境变量（服务器上执行）

```bash
cd /var/www/nextjs-app/deploy
cp .env.production.example ../.env.production
vi ../.env.production
```

对照你本地 `C:\Users\29942\Desktop\daniya-fansite\.env.local` 逐项填写：
- `AUTH_SECRET` — `openssl rand -base64 32` 生成新值（服务器上用新值没问题）
- `DATABASE_URL` / `DIRECT_URL` — 与本地相同（Neon 云端库，全球可用）
- `AUTH_URL` — **必须改成 `http://你的服务器IP`**（填错会导致登录接口 500）
- `ADMIN_USER_ID` / `IMGURL_*` / `ZHIPU_*` — 与本地相同

---

## 四、启动（服务器上执行）

```bash
cd /var/www/nextjs-app/deploy
bash start.sh
```

首次会拉取基础镜像 + 构建（约 5~15 分钟），之后：

- 浏览器访问 `http://你的服务器IP` ✅
- 查看日志：`docker compose logs -f app`
- 常用管理：`docker compose ps` / `docker compose restart app` / `docker compose down`

---

## 五、日常更新（有代码改动后）

每次更新就两步：**本机同步代码 → 服务器重建容器**。

```bash
# 1. 本机（Git Bash）：
bash deploy/sync-local.sh 你的服务器IP

# 2. 服务器（SSH）：
cd /var/www/nextjs-app/deploy && bash start.sh    # 增量构建 + 滚动重启
```

`sync-local.sh` 默认增量传输（只传代码，几 MB，秒级完成）：
- **跳过 `public/背景图片`**（968MB，只在首次 `--full` 传一次）
- **跳过 `content/`**（服务器上审核产生的作品 MDX 以服务器为准，防止本地旧版本覆盖——这条很重要，别手动全量覆盖 `content`）

特殊情况：
- **更新了作品内容（MDX）**：只改作品文件，不用重建容器。直接把文件传到服务器对应位置即可：
  `scp content/posts/xxx/index.mdx root@IP:/var/www/nextjs-app/content/posts/xxx/index.mdx`
- **改了数据库结构（prisma/schema.prisma）**：重建后还需同步数据库：
  `docker compose exec app npx prisma db push`
- **首次部署**：`bash deploy/sync-local.sh 你的服务器IP --full`（含背景图，传输较久）

---

## 六、故障排查

| 现象 | 原因 / 解决 |
|---|---|
| 登录接口 `/api/auth/session` 返回 500 | `AUTH_URL` 与浏览器访问地址不一致，或 `AUTH_SECRET` 未填 |
| 审核通过后新作品详情页 404 | 详情页是构建期静态生成的，重新 `bash start.sh` 构建一次即可（作品集列表页是动态的，即时生效） |
| 首页背景图不显示 | 确认 `public/背景图片` 已传到服务器（`ls /var/www/nextjs-app/public/背景图片`，共 72 个文件） |
| 构建时 OOM / 卡死 | 按「一.3」加 swap 后重试 |
| 审核投稿后内容丢失 | 检查 `content` 卷挂载（`docker compose ps` 里 app 的 VOLUMES 列应有 `…/content`） |
| 容器起来了但访问超时 | 安全组/防火墙没放行 80，或 Caddy 没起来（`docker compose logs caddy`） |

---

## 七、以后有了域名（可选）

1. 云控制台把域名 A 记录解析到服务器 IP
2. 编辑 `deploy/Caddyfile`：`:80 {` 改为 `你的域名 {`，并去掉注释
3. 编辑 `deploy/docker-compose.yml`：ports 加 `"443:443"`
4. `bash start.sh` 重启，Caddy 自动签发 HTTPS 证书，访问 `https://你的域名`
   - ⚠️ 国内服务器 + 80/443 需要 ICP 备案；未备案用香港/海外节点则无此限制
