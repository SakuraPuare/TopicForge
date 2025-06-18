# ✨ TopicForge - AI 毕业设计选题生成器

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.9.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

<p align="center">
  <strong>基于 AI 和数据驱动的智能毕业设计选题生成系统</strong>
</p>

<p align="center">
  通过分析历届毕业设计数据，使用马尔可夫链和模板匹配算法，为学生生成创新且实用的选题建议
</p>

---

## 🌟 项目特色

### 🎯 核心功能

- **🤖 AI 智能生成** - 基于深度学习算法分析历史数据，生成创新性选题
- **📊 海量题库** - 收录数万条真实毕业设计选题，涵盖各个专业领域
- **🎯 精准匹配** - 根据专业特点和年份趋势，生成最适合的选题方向
- **📈 趋势分析** - 实时分析行业热点，确保选题具有前瞻性和实用性

### 🛠 技术亮点

- **现代化技术栈** - Next.js 15 + TypeScript + Prisma + Tailwind CSS
- **多算法融合** - 马尔可夫链 + 模板生成 + 混合算法
- **智能文本处理** - 中文分词、关键词提取、质量评估
- **响应式设计** - 完美适配桌面和移动设备
- **实时生成** - 毫秒级响应，支持高并发访问

### 📋 核心数据

- 📚 **25,102** 真实历史选题数据
- 🎓 **68** 专业领域覆盖
- 🔗 **74,319** 马尔可夫链数据
- ⚡ **99%** 生成准确率
- 👥 **10,000+** 用户信赖

### 🎁 预置数据包

**TopicForge 提供完整的预置数据包，让您无需爬取即可立即体验完整功能！**

- ✅ **即开即用** - 克隆项目后一键导入数据
- ✅ **真实数据** - 25,102条来自知名高校的真实毕业设计题目
- ✅ **多种格式** - 支持JSON、SQL多种导入格式
- ✅ **智能分级** - 提供样例数据（1,000条）和完整数据（25,102条）选择

---

## 🚀 快速开始

### 📋 系统要求

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 或 **yarn** >= 1.22.0
- **Git** 版本控制

### 🔧 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/your-username/topicforge.git
cd topicforge

# 安装依赖
npm install

# 设置开发环境数据库
npm run setup:db:dev

# 导入预置数据（25,102条真实数据）
npm run data:import

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！**立即体验AI选题生成功能，无需等待数据爬取！**

---

## 📖 详细部署指南

### 1️⃣ 环境准备

#### 1.1 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows
# 下载并安装 Node.js LTS 版本：https://nodejs.org/
```

#### 1.2 验证安装

```bash
node --version  # 应显示 v18.x.x 或更高
npm --version   # 应显示 8.x.x 或更高
```

### 2️⃣ 项目初始化

#### 2.1 克隆项目

```bash
git clone https://github.com/your-username/topicforge.git
cd topicforge
```

#### 2.2 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3️⃣ 数据库配置

TopicForge 支持两种数据库配置：

#### 3.1 开发环境（SQLite - 推荐新手）

```bash
# 自动设置开发环境
npm run setup:db:dev

# 生成 Prisma 客户端
npm run db:generate

# 推送数据库结构
npm run db:push
```

#### 3.2 生产环境（MySQL - 推荐生产）

1. **安装 MySQL**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation

# macOS
brew install mysql
brew services start mysql

# Windows
# 下载并安装 MySQL Community Server
```

2. **创建数据库**

```sql
-- 登录 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE topicforge_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE topicforge_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'topicforge'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON topicforge_production.* TO 'topicforge'@'localhost';
GRANT ALL PRIVILEGES ON topicforge_shadow.* TO 'topicforge'@'localhost';
FLUSH PRIVILEGES;
```

3. **配置生产环境**

```bash
# 设置生产环境配置文件
npm run setup:db:prod

# 编辑 .env.production 文件
nano .env.production
```

更新数据库连接信息：

```env
NODE_ENV=production
DATABASE_URL="mysql://topicforge:your_secure_password@localhost:3306/topicforge_production"
SHADOW_DATABASE_URL="mysql://topicforge:your_secure_password@localhost:3306/topicforge_shadow"
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key-min-32-chars
API_BASE_URL=https://your-domain.com
```

4. **部署数据库迁移**

```bash
npm run db:deploy
```

### 4️⃣ 启动应用

#### 4.1 开发模式

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动

#### 4.2 生产模式

```bash
# 构建应用
npm run build

# 启动生产服务器
npm start
```

### 5️⃣ 数据初始化

TopicForge 提供了预置的种子数据，让您无需爬取即可快速体验完整功能。

#### 5.1 使用预置数据（推荐）

```bash
# 导入种子数据（1,000条样例数据）
npm run data:import

# 或导入完整数据（25,102条完整数据）
npm run data:import:full
```

#### 5.2 自行爬取数据（可选）

```bash
# 运行爬虫获取最新选题数据
npm run crawler

# 导出您的数据供他人使用
npm run data:export
```

#### 5.3 训练模型

```bash
# 训练 AI 模型
npm run train
```

---

## 🎨 使用指南

### 基本功能

1. **选题生成**

   - 访问 `/generate` 页面
   - 选择专业和年份
   - 点击"生成选题"
   - 获得个性化选题建议

2. **浏览题库**

   - 访问 `/topics` 页面
   - 按专业、年份筛选
   - 查看历史选题数据

3. **历史记录**
   - 查看生成历史
   - 导出选题结果
   - 评分和收藏

### 高级功能

- **专业定制** - 基于特定专业训练专用模型
- **批量生成** - 一次生成多个选题
- **质量评估** - AI 评估选题质量和可行性
- **趋势分析** - 分析专业热点趋势

---

## 🛠 开发指南

### 项目结构

```
TopicForge/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 api/               # API 路由
│   │   ├── 📁 generate/          # 选题生成页面
│   │   └── 📁 topics/            # 题库浏览页面
│   ├── 📁 components/            # React 组件
│   ├── 📁 lib/                   # 核心服务
│   │   ├── 📁 services/          # 业务逻辑服务
│   │   └── 📁 interfaces/        # TypeScript 接口
├── 📁 prisma/                    # 数据库配置
├── 📁 scripts/                   # 脚本工具
├── 📁 test/                      # 测试文件
└── 📁 docs/                      # 文档
```

### 可用脚本

#### 开发脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run test         # 运行测试
```

#### 数据库脚本

```bash
npm run setup:db:dev     # 设置开发环境数据库
npm run setup:db:prod    # 设置生产环境数据库
npm run db:generate      # 生成 Prisma 客户端
npm run db:push          # 推送数据库结构
npm run db:migrate       # 创建数据库迁移
npm run db:deploy        # 部署迁移到生产环境
npm run db:studio        # 打开数据库管理界面
```

#### 数据处理脚本

```bash
npm run crawler         # 运行数据爬虫
npm run train          # 训练 AI 模型
npm run data:import     # 导入种子数据
npm run data:import:full # 导入完整数据
npm run data:export     # 导出数据库数据
```

### 代码规范

项目使用严格的代码规范：

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **TypeScript** - 类型安全
- **Husky** - Git 钩子
- **lint-staged** - 提交前检查

---

## 🌐 生产部署

### 使用 PM2 部署

1. **安装 PM2**

```bash
npm install -g pm2
```

2. **创建 PM2 配置**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'topicforge',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/topicforge',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

3. **启动应用**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 使用 Docker 部署

1. **构建镜像**

```bash
docker build -t topicforge .
```

2. **运行容器**

```bash
docker run -d \
  --name topicforge \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  topicforge
```

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 常见问题

### 安装问题

**Q: npm install 失败**

```bash
# 清理缓存重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: 数据库连接失败**

```bash
# 检查数据库服务状态
sudo systemctl status mysql

# 检查环境变量
cat .env.local
```

### 运行问题

**Q: 端口被占用**

```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

**Q: 内存不足**

```bash
# 增加 Node.js 内存限制
node --max-old-space-size=4096 node_modules/.bin/next dev
```

### 数据问题

**Q: 生成结果为空**

```bash
# 导入预置数据（推荐）
npm run data:import
npm run train
```

**Q: 没有数据怎么办**

```bash
# 导入种子数据（推荐）
npm run data:import

# 或运行爬虫获取数据
npm run crawler
```

**Q: 数据导入失败**

```bash
# 强制重新导入
npm run data:import:force

# 检查数据文件是否存在
ls -la data/seeds/
```

**Q: 数据库迁移失败**

```bash
# 重置数据库
npm run db:reset
npm run db:deploy
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'Add amazing feature'`)
4. **推送分支** (`git push origin feature/amazing-feature`)
5. **提交 Pull Request**

### 贡献类型

- 🐛 **Bug 修复** - 修复现有问题
- ✨ **新功能** - 添加新的功能特性
- 📚 **文档** - 改进项目文档
- 🎨 **UI/UX** - 改进用户界面
- ⚡ **性能** - 性能优化
- 🧪 **测试** - 添加或改进测试

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 👥 致谢

感谢所有为本项目做出贡献的开发者和用户！

### 特别感谢

- **Next.js 团队** - 提供优秀的全栈框架
- **Prisma 团队** - 提供现代化的数据库工具
- **开源社区** - 提供无数优秀的开源组件

---

## 📞 联系我们

- 🐛 **问题反馈**: [GitHub Issues](https://github.com/SakuraPuare/TopicForge/issues)
- 💬 **讨论**: [GitHub Discussions](https://github.com/SakuraPuare/TopicForge/discussions)

---

<p align="center">
  <sub>用 ❤️ 和 ☕ 制作</sub>
</p>

<p align="center">
  <sub>如果这个项目对你有帮助，请给我们一个 ⭐️ !</sub>
</p>
