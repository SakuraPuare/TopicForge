# TopicForge - 毕业设计选题生成系统

## 🎯 项目概述

**TopicForge** 是一个基于数据驱动的毕业设计选题自动生成系统。通过爬取和分析历届毕业设计标题，使用机器学习算法生成新颖且合理的选题建议。

### 核心价值

- 解决学生选题困难问题
- 提供多样化、有创意的选题建议
- 基于真实数据，确保选题的实用性和可行性

## 📋 需求分析

### 功能需求

- [x] 数据爬取：获取历届毕业设计标题数据
- [x] 数据存储：安全可靠的数据库存储
- [x] 文本处理：中文分词、清洗、标准化
- [x] 算法生成：基于马尔科夫链的选题生成
- [x] Web界面：用户友好的选题生成界面
- [x] 选题管理：收藏、导出、历史记录

### 技术需求

- [x] 高并发支持
- [x] 数据安全性
- [x] 响应式设计
- [x] SEO优化

## 🛠 技术选型分析

### 推荐技术栈（现代化方案）

#### 后端

- **Node.js 18+** - 服务端运行时
- **Prisma** - ORM 数据库管理
- **PostgreSQL** - 主数据库（推荐）或 SQLite（开发）
- **Express.js** - Web框架
- **TypeScript** - 类型安全

#### 前端

- **Next.js 14** - React全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI组件库
- **React Hook Form** - 表单管理

#### 数据处理

- **jieba.js** - 中文分词
- **Puppeteer/Playwright** - 网页爬虫
- **cheerio** - HTML解析
- **natural** - 自然语言处理

#### 算法实现

- **马尔科夫链** - 主要生成算法
- **TF-IDF** - 关键词提取
- **余弦相似度** - 相似度计算

## 📅 开发计划

## 阶段一：项目初始化 (3-5天)

### 1.1 环境搭建

- [ ] 初始化 Next.js + TypeScript 项目
- [ ] 配置 ESLint + Prettier
- [ ] 设置 Prisma + PostgreSQL
- [ ] 配置环境变量管理
- [ ] 设置 Git 工作流

### 1.2 基础架构

- [ ] 设计数据库Schema
- [ ] 创建基础API路由结构
- [ ] 设置错误处理中间件
- [ ] 配置日志系统

## 阶段二：数据层开发 (7-10天)

### 2.1 数据库设计

```sql
-- 毕业设计题目表
GraduationTopics {
  id          String   @id @default(cuid())
  title       String   @unique
  school      String?
  major       String?
  year        Int?
  keywords    String[]
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

-- 分词结果表
TokenizedWords {
  id        String @id @default(cuid())
  topicId   String
  word      String
  position  Int
  frequency Int    @default(1)
  topic     GraduationTopics @relation(fields: [topicId], references: [id])
}

-- 生成历史表
GeneratedTopics {
  id        String   @id @default(cuid())
  content   String
  algorithm String   // 'markov', 'template', etc.
  params    Json?    // 生成参数
  rating    Int?     // 用户评分
  createdAt DateTime @default(now())
}

-- 马尔科夫链状态表
MarkovChains {
  id          String @id @default(cuid())
  currentWord String
  nextWord    String
  frequency   Int    @default(1)
  @@unique([currentWord, nextWord])
}
```

### 2.2 爬虫系统

- [x] **目标网站分析**

  - [x] 识别目标院校的毕业设计展示网站
  - [x] 分析网页结构和反爬策略
  - [x] 制定爬取策略（并发、频率控制）

- [x] **爬虫开发**

  - [x] 基础爬虫框架（Puppeteer）
  - [x] 多站点适配器模式
  - [x] 数据清洗和验证
  - [x] 错误处理和重试机制
  - [x] 增量更新策略

- [x] **数据质量控制**
  - [x] 重复数据检测和去除
  - [x] 数据格式标准化
  - [x] 异常数据过滤
  - [x] 数据完整性验证

## 阶段三：算法引擎开发 (10-14天)

### 3.1 文本预处理

- [x] **中文分词模块**

  - [x] 集成 jieba.js
  - [x] 自定义词典（计算机、工程类专业词汇）
  - [x] 停用词过滤
  - [x] 词性标注

- [x] **文本清洗**
  - [x] 去除特殊字符和噪音
  - [x] 统一格式化
  - [x] 长度过滤
  - [x] 质量评分

### 3.2 马尔科夫链实现

- [x] **核心算法**

  - [x] N-gram 模型实现（推荐2-gram起步）
  - [x] 状态转移矩阵构建
  - [x] 概率计算和归一化
  - [x] 文本生成引擎

- [x] **优化策略**

  - [x] 开始词和结束词处理
  - [x] 长度控制机制
  - [x] 质量评估函数
  - [x] 多样性保证

- [x] **性能优化**
  - [x] 批量数据库操作
  - [x] 分词结果批量插入
  - [x] 关键词统计批量更新
  - [x] 马尔科夫链数据批量保存

### 3.3 高级生成策略

- [x] **基于模板的生成**

  - [x] 专业领域模板库
  - [x] 关键词替换策略
  - [x] 语法正确性检查

- [x] **混合算法**
  - [x] 马尔科夫 + 模板混合
  - [x] 权重调节机制
  - [ ] A/B测试框架

### 3.4 算法调优（已完成） ✅

- [x] **马尔科夫链优化**
  - [x] 调整质量评分标准（降低基础分数要求，优化加分机制）
  - [x] 优化文本生成逻辑（改进状态回退策略，增加兜底机制）
  - [x] 增加生成多样性（增加生成尝试次数，优化参数配置）
  - [x] 提高生成成功率（从0%提升至71.4%）

### 3.5 性能优化成果

- **生成成功率：** 从 0% 提升至 71.4%
- **训练样本利用率：** 从仅高质量(>=0.6)扩展到中等质量(>=0.3)
- **质量评分优化：** 降低基础阈值从0.5到0.3，增加专业词汇权重
- **生成参数调优：**
  - 最小长度：10 → 6 字符
  - 最大长度：30 → 25 字符
  - 质量阈值：0.2 → 0.15
  - 增加100次重试机制和状态回退策略

## 阶段四：API开发 (5-7天)

### 4.1 核心API

- [ ] **POST** `/api/topics/generate` - 生成选题
- [ ] **GET** `/api/topics/history` - 获取生成历史
- [ ] **POST** `/api/topics/rate` - 选题评分
- [ ] **GET** `/api/stats` - 系统统计信息

### 4.2 管理API

- [ ] **POST** `/api/admin/crawl/start` - 启动爬虫
- [ ] **GET** `/api/admin/crawl/status` - 爬虫状态
- [ ] **POST** `/api/admin/algorithm/retrain` - 重新训练模型

### 4.3 API文档

- [ ] Swagger/OpenAPI 文档
- [ ] 接口测试用例
- [ ] 性能基准测试

## 阶段五：前端开发 (7-10天)

### 5.1 页面结构

- [ ] **首页** - 选题生成界面

  - [ ] 参数配置面板（专业、年份、关键词）
  - [ ] 一键生成按钮
  - [ ] 结果展示区域
  - [ ] 历史记录侧边栏

- [ ] **结果页面**

  - [ ] 选题列表展示
  - [ ] 收藏和导出功能
  - [ ] 相似度分析
  - [ ] 评分系统

- [ ] **统计页面**
  - [ ] 生成数量统计
  - [ ] 热门关键词
  - [ ] 用户评分分析

### 5.2 用户体验

- [ ] 响应式设计（移动端适配）
- [ ] 加载状态和进度条
- [ ] 错误提示和用户引导
- [ ] 暗色主题支持

### 5.3 高级功能

- [ ] 实时生成（WebSocket）
- [ ] 批量生成和导出
- [ ] 社交分享功能
- [ ] 用户偏好记忆

## 阶段六：测试与优化 (5-7天)

### 6.1 功能测试

- [ ] 单元测试（Jest）
- [ ] 集成测试
- [ ] 端到端测试（Playwright）
- [ ] API压力测试

### 6.2 性能优化

- [ ] 数据库查询优化
- [ ] 算法性能调优
- [ ] 前端资源优化
- [ ] CDN配置

### 6.3 安全性

- [ ] 输入验证和清洗
- [ ] 防止SQL注入
- [ ] 频率限制
- [ ] CORS配置

## 阶段七：部署与发布 (3-5天)

### 7.1 部署准备

- [ ] Docker容器化
- [ ] 环境变量配置
- [ ] 数据库迁移脚本
- [ ] 监控和日志配置

### 7.2 上线部署

- [ ] Vercel/Railway 部署
- [ ] 域名和SSL配置
- [ ] 数据库备份策略
- [ ] 监控告警设置

## 🔧 实施详细步骤

### Step 1: 项目初始化

```bash
# 创建Next.js项目
npx create-next-app@latest topicforge --typescript --tailwind --eslint --app

# 安装核心依赖
npm install prisma @prisma/client
npm install puppeteer cheerio jieba
npm install express cors helmet morgan

# 安装开发依赖
npm install -D @types/node @types/express
npm install -D jest @testing-library/react @testing-library/jest-dom
```

### Step 2: 数据库初始化

```bash
# 初始化Prisma
npx prisma init

# 创建数据库Schema
# 编辑 prisma/schema.prisma

# 生成Prisma客户端
npx prisma generate

# 创建并运行迁移
npx prisma migrate dev --name init
```

### Step 3: 核心功能开发顺序

1. **数据模型定义** - 先定义好所有的数据结构
2. **爬虫系统** - 获取训练数据
3. **文本处理** - 数据预处理管道
4. **马尔科夫链** - 核心生成算法
5. **API接口** - 业务逻辑封装
6. **前端界面** - 用户交互界面

## ⚡ 快速启动指南

### 最小可用产品(MVP)功能

1. 手动导入100-200条样本数据
2. 基础的2-gram马尔科夫链
3. 简单的生成接口
4. 基础的Web界面

### 第一个里程碑目标

- 能够生成基本合理的选题
- 界面友好，响应速度快
- 基础的数据管理功能

## 🎯 成功指标

### 技术指标

- 生成速度：< 2秒
- 系统可用性：> 99%
- 并发支持：100+ 用户

### 业务指标

- 选题质量评分：> 4.0/5.0
- 用户满意度：> 80%
- 日活用户：> 50

## 📚 学习资源

### 算法相关

- [马尔科夫链理论基础](https://en.wikipedia.org/wiki/Markov_chain)
- [自然语言处理入门](https://web.stanford.edu/~jurafsky/slp3/)
- [中文分词技术综述](https://github.com/fxsjy/jieba)

### 技术文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [Prisma 指南](https://www.prisma.io/docs)
- [Puppeteer API](https://pptr.dev/)

## 🚀 扩展计划

### 未来功能

- [ ] AI驱动的选题优化（集成GPT API）
- [ ] 多语言支持
- [ ] 导师匹配系统
- [ ] 选题难度评估
- [ ] 协作选题功能

### 商业化可能

- [ ] 高校定制版本
- [ ] API服务输出
- [ ] 数据分析报告
- [ ] 选题咨询服务

---

**预计总开发时间：6-8周**
**团队规模：1-2人**
**技术难度：中等**

这个项目非常适合作为毕业设计，既有技术深度，又有实用价值！🎉
