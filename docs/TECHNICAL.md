# TopicForge 技术文档

> 版本: 1.0.0 | 更新日期: 2025-12-02

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [架构设计](#3-架构设计)
4. [核心模块详解](#4-核心模块详解)
5. [数据库设计](#5-数据库设计)
6. [前端架构](#6-前端架构)
7. [API 参考](#7-api-参考)
8. [开发指南](#8-开发指南)
9. [测试指南](#9-测试指南)
10. [部署说明](#10-部署说明)
11. [最佳实践](#11-最佳实践)
12. [故障排除](#12-故障排除)
13. [附录](#13-附录)

---

## 1. 项目概述

### 1.1 项目简介

TopicForge 是一个 AI 驱动的毕业设计选题生成系统。该系统基于 25,102 个真实毕业设计题目数据，
涵盖 68 个学术专业，使用马尔科夫链和模板算法智能生成新的选题建议。

### 1.2 核心功能

| 功能模块         | 描述                                         |
| ---------------- | -------------------------------------------- |
| **智能选题生成** | 基于马尔科夫链、模板或混合算法生成高质量选题 |
| **选题库浏览**   | 搜索、筛选和浏览真实毕业设计题目             |
| **专业适配**     | 支持 68 个专业的定制化选题生成               |
| **质量评估**     | 自动评估生成选题的质量分数                   |
| **历史记录**     | 保存和查看生成历史                           |

### 1.3 技术亮点

- **现代化架构**: 采用 Next.js 16 App Router + React 19 + TypeScript 5
- **依赖注入**: 使用 tsyringe 实现企业级 DI 模式
- **类型安全**: 全面的 TypeScript 类型覆盖，Result<T> 错误处理
- **中文 NLP**: 集成 nodejieba 进行中文分词和关键词提取
- **响应式设计**: 支持桌面和移动端的完整用户体验

---

## 2. 技术栈

### 2.1 核心框架

| 技术           | 版本   | 用途                         |
| -------------- | ------ | ---------------------------- |
| **Next.js**    | 16.0.6 | 全栈 React 框架 (App Router) |
| **React**      | 19.0.0 | UI 组件库                    |
| **TypeScript** | 5.x    | 类型安全的 JavaScript        |
| **Prisma**     | 6.19.0 | 现代化 ORM                   |
| **tsyringe**   | 4.10.0 | 依赖注入容器                 |

### 2.2 前端技术

| 技术             | 版本    | 用途            |
| ---------------- | ------- | --------------- |
| **Tailwind CSS** | 4.x     | 原子化 CSS 框架 |
| **Radix UI**     | 最新    | 无障碍 UI 原语  |
| **shadcn/ui**    | 最新    | 组件库          |
| **Lucide React** | 0.555.0 | 图标库          |
| **next-themes**  | 0.4.6   | 主题切换        |
| **sonner**       | 2.0.5   | Toast 通知      |
| **cmdk**         | 1.1.1   | 命令面板        |

### 2.3 后端技术

| 技术          | 版本   | 用途        |
| ------------- | ------ | ----------- |
| **nodejieba** | 3.4.4  | 中文分词    |
| **natural**   | 8.1.0  | NLP 工具库  |
| **zod**       | 内置   | Schema 验证 |
| **axios**     | 1.10.0 | HTTP 客户端 |

### 2.4 数据库

| 环境     | 数据库 | 说明                 |
| -------- | ------ | -------------------- |
| 开发环境 | SQLite | 文件数据库，无需安装 |
| 生产环境 | MySQL  | 高性能关系数据库     |

### 2.5 开发工具

| 工具            | 版本   | 用途         |
| --------------- | ------ | ------------ |
| **ESLint**      | 9.x    | 代码检查     |
| **Prettier**    | 3.2.5  | 代码格式化   |
| **Husky**       | 9.0.11 | Git Hooks    |
| **lint-staged** | 16.2.7 | 暂存文件检查 |
| **Jest**        | 30.0.0 | 测试框架     |
| **Playwright**  | 1.53.0 | E2E 测试     |

### 2.6 构建工具

| 工具          | 用途                          |
| ------------- | ----------------------------- |
| **Turbopack** | 开发环境快速构建              |
| **Webpack**   | 生产环境构建 (nodejieba 兼容) |
| **tsx**       | TypeScript 脚本执行器         |

---

## 3. 架构设计

### 3.1 整体架构

TopicForge 采用经典的分层架构设计，遵循关注点分离原则：

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端 (浏览器)                           │
│                    React 19 + Next.js App Router                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     表现层 (Presentation Layer)                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Next.js App Router                                       │   │
│  │  - 页面组件 (Server Components + Client Components)       │   │
│  │  - API Routes (/api/generate, /api/topics)               │   │
│  │  - Server Actions                                         │   │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      服务层 (Service Layer)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  业务逻辑服务 (单例模式)                                   │   │
│  │  - TopicGeneratorService (主编排服务)                     │   │
│  │  - MarkovChainService (马尔科夫链生成)                    │   │
│  │  - TemplateGeneratorService (模板生成)                    │   │
│  │  - TextProcessorService (文本处理/NLP)                    │   │
│  │  - MajorService (专业管理)                                │   │
│  │  - DataService (数据持久化)                               │   │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      领域层 (Domain Layer)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  领域接口和类型定义                                        │   │
│  │  - Repository 接口 (IXxxRepository)                       │   │
│  │  - Result<T, E> 类型                                      │   │
│  │  - 领域错误 (DomainError 层次结构)                         │   │
│  │  - DTO 类型定义                                           │   │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   基础设施层 (Infrastructure Layer)              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  数据访问实现                                              │   │
│  │  - Repository 实现 (XxxRepository)                        │   │
│  │  - DatabaseClient (Prisma 客户端包装)                     │   │
│  │  - BaseRepository (基类模板)                              │   │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         核心层 (Core Layer)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  依赖注入和类型工具                                        │   │
│  │  - container.ts (DI 容器配置)                             │   │
│  │  - tokens.ts (注入令牌定义)                               │   │
│  │  - Result<T> 类型工具                                     │   │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                           数据库                                 │
│                   SQLite (开发) / MySQL (生产)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 目录结构

```
TopicForge/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 首页
│   │   ├── globals.css               # 全局样式
│   │   ├── api/                      # API 路由
│   │   │   ├── generate/route.ts     # 生成 API
│   │   │   └── topics/route.ts       # 搜索 API
│   │   ├── generate/                 # 生成页面
│   │   │   ├── page.tsx
│   │   │   ├── generate-client.tsx
│   │   │   ├── history.tsx
│   │   │   ├── actions.ts
│   │   │   └── result/[sessionId]/   # 结果页面
│   │   └── topics/                   # 选题库页面
│   │       ├── page.tsx
│   │       ├── topics-client.tsx
│   │       └── actions.ts
│   │
│   ├── lib/                          # 核心库
│   │   ├── core/                     # DI 核心
│   │   │   ├── container.ts          # 容器配置
│   │   │   └── tokens.ts             # 注入令牌
│   │   ├── domain/                   # 领域层
│   │   │   ├── interfaces/           # 接口定义
│   │   │   │   ├── repositories/     # Repository 接口
│   │   │   │   └── services/         # Service 接口
│   │   │   ├── types/                # 类型定义
│   │   │   └── errors/               # 领域错误
│   │   ├── infrastructure/           # 基础设施层
│   │   │   ├── database/             # 数据库客户端
│   │   │   └── repositories/         # Repository 实现
│   │   ├── services/                 # 服务层
│   │   │   ├── topic-generator.service.ts
│   │   │   ├── markov-chain.service.ts
│   │   │   ├── template-generator.service.ts
│   │   │   ├── text-processor.service.ts
│   │   │   ├── major.service.ts
│   │   │   ├── data.service.ts
│   │   │   └── index.ts              # 导出入口
│   │   ├── interfaces/               # 传统接口 (向后兼容)
│   │   ├── constants/                # 常量定义
│   │   │   ├── stop-words.ts         # 停用词
│   │   │   └── tech-dict.ts          # 技术词典
│   │   └── db.ts                     # 向后兼容的数据库访问
│   │
│   └── components/                   # React 组件
│       ├── ui/                       # shadcn/ui 组件
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   ├── select.tsx
│       │   ├── searchable-select.tsx
│       │   ├── tabs.tsx
│       │   ├── dialog.tsx
│       │   └── ...
│       ├── layout/                   # 布局组件
│       │   └── navigation.tsx
│       ├── theme-provider.tsx        # 主题提供者
│       └── mode-toggle.tsx           # 主题切换
│
├── prisma/
│   ├── schema.prisma                 # 数据库 Schema
│   └── migrations/                   # 迁移文件
│
├── scripts/                          # 工具脚本
│   ├── crawler.ts                    # 数据爬虫
│   ├── train-model.ts                # 模型训练
│   ├── setup-database.ts             # 数据库初始化
│   ├── import-seeds.ts               # 数据导入
│   └── export-database.ts            # 数据导出
│
├── test/                             # 测试文件
│   ├── unit/                         # 单元测试
│   ├── integration/                  # 集成测试
│   ├── components/                   # 组件测试
│   └── e2e/                          # E2E 测试
│
├── data/                             # 数据文件
│   ├── seeds/                        # 种子数据
│   └── exports/                      # 导出数据
│
├── docs/                             # 文档
│   ├── TECHNICAL.md                  # 技术文档 (本文档)
│   └── API.md                        # API 文档
│
├── .github/                          # GitHub 配置
│   └── workflows/                    # CI/CD 工作流
│
├── package.json                      # 项目配置
├── tsconfig.json                     # TypeScript 配置
├── next.config.ts                    # Next.js 配置
├── jest.config.js                    # Jest 配置
├── eslint.config.mjs                 # ESLint 配置
├── .prettierrc                       # Prettier 配置
├── CLAUDE.md                         # Claude Code 指导
├── CONTRIBUTING.md                   # 贡献指南
└── README.md                         # 项目说明
```

### 3.3 依赖注入系统

#### 3.3.1 设计原理

TopicForge 使用 tsyringe 作为依赖注入框架，实现了控制反转 (IoC) 和依赖倒置原则：

```typescript
// src/lib/core/tokens.ts - 注入令牌定义
export const TOKENS = {
  // 数据库
  PrismaClient: Symbol.for('PrismaClient'),

  // Repositories (8 个)
  GraduationTopicRepository: Symbol.for('GraduationTopicRepository'),
  GeneratedTopicRepository: Symbol.for('GeneratedTopicRepository'),
  GenerationSessionRepository: Symbol.for('GenerationSessionRepository'),
  MajorRepository: Symbol.for('MajorRepository'),
  MarkovChainRepository: Symbol.for('MarkovChainRepository'),
  MajorMarkovChainRepository: Symbol.for('MajorMarkovChainRepository'),
  KeywordStatsRepository: Symbol.for('KeywordStatsRepository'),
  TokenizedWordRepository: Symbol.for('TokenizedWordRepository'),

  // Services (6 个)
  TextProcessorService: Symbol.for('TextProcessorService'),
  MarkovChainService: Symbol.for('MarkovChainService'),
  TemplateGeneratorService: Symbol.for('TemplateGeneratorService'),
  MajorService: Symbol.for('MajorService'),
  TopicGeneratorService: Symbol.for('TopicGeneratorService'),
  DataService: Symbol.for('DataService'),
} as const;
```

#### 3.3.2 容器配置

```typescript
// src/lib/core/container.ts
import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { TOKENS } from './tokens';

function registerDependencies(c: DependencyContainer): void {
  // 单例注册 - 数据库客户端
  c.registerSingleton(TOKENS.PrismaClient, DatabaseClient);

  // 可转移实例注册 - Repositories
  c.register(TOKENS.GraduationTopicRepository, {
    useClass: GraduationTopicRepository,
  });
  // ... 其他 Repository 注册
}

// 便捷获取方法
export function getGraduationTopicRepository(): IGraduationTopicRepository {
  return container.resolve<IGraduationTopicRepository>(
    TOKENS.GraduationTopicRepository
  );
}

// 测试支持
export function createChildContainer(): DependencyContainer {
  return container.createChildContainer();
}

export function resetContainer(): void {
  container.clearInstances();
}
```

#### 3.3.3 使用示例

```typescript
// 在服务中使用 Repository
import { getGraduationTopicRepository } from '@/lib/db';

async function fetchTopics() {
  const repo = getGraduationTopicRepository();
  const result = await repo.findMany({ page: 1, pageSize: 10 });

  if (result.success) {
    return result.data;
  } else {
    console.error(result.error);
    return [];
  }
}
```

### 3.4 Result 类型模式

#### 3.4.1 类型定义

TopicForge 使用 Result<T, E> 类型进行函数式错误处理：

```typescript
// src/lib/domain/types/result.ts
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// 工具函数
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

#### 3.4.2 使用方式

```typescript
// Repository 方法返回 Result
async findById(id: string): Promise<Result<TopicDTO | null, DatabaseError>> {
  return this.executeQuery(async () => {
    return await this.prisma.graduationTopic.findUnique({
      where: { id }
    });
  }, 'findById');
}

// 调用方处理 Result
const result = await repo.findById(id);

if (result.success) {
  // TypeScript 自动推断 result.data 类型
  console.log(result.data);
} else {
  // TypeScript 自动推断 result.error 类型
  console.error(result.error.message);
}
```

### 3.5 领域错误层次

```typescript
// src/lib/domain/errors/
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

export class ValidationError extends DomainError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
}

export class NotFoundError extends DomainError {
  code = 'NOT_FOUND';
  statusCode = 404;
}

export class InsufficientDataError extends DomainError {
  code = 'INSUFFICIENT_DATA';
  statusCode = 422;
}

export class GenerationError extends DomainError {
  code = 'GENERATION_ERROR';
  statusCode = 500;
}

export class DatabaseError extends DomainError {
  code = 'DATABASE_ERROR';
  statusCode = 500;
}

export class ConfigurationError extends DomainError {
  code = 'CONFIGURATION_ERROR';
  statusCode = 500;
}

export class TrainingError extends DomainError {
  code = 'TRAINING_ERROR';
  statusCode = 500;
}
```

---

## 4. 核心模块详解

### 4.1 服务层架构

服务层包含所有业务逻辑，采用单例模式导出：

```
┌─────────────────────────────────────────────────────────────────┐
│                   TopicGeneratorService (主编排)                 │
│                        协调所有其他服务                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  MarkovChain     │  │  TemplateGenerator│  │  Major       │   │
│  │  Service         │  │  Service          │  │  Service     │   │
│  │  马尔科夫链生成   │  │  模板生成         │  │  专业管理    │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
│           │                     │                    │           │
│  ┌────────┴─────────────────────┴────────────────────┘           │
│  │                                                               │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  │  TextProcessor   │  │  DataService     │                  │
│  │  │  Service         │  │  数据持久化      │                  │
│  │  │  文本处理/NLP    │  │                  │                  │
│  │  └──────────────────┘  └──────────────────┘                  │
│  │                                                               │
└──┴───────────────────────────────────────────────────────────────┘
```

### 4.2 TopicGeneratorService

主编排服务，协调整个选题生成流程。

**文件位置**: `src/lib/services/topic-generator.service.ts`

#### 4.2.1 核心职责

- 协调模型训练和生成流程
- 选择和切换生成算法
- 处理 fallback 逻辑
- 生成统计信息

#### 4.2.2 主要方法

```typescript
class TopicGeneratorService {
  /**
   * 训练模型
   * @param major 可选的专业名称，不提供则训练全局模型
   */
  async trainModel(major?: string): Promise<TrainingResult>;

  /**
   * 生成选题
   * @param params 生成参数
   */
  async generateTopics(params: GenerationParams): Promise<GenerationResult>;

  /**
   * 获取系统统计信息
   */
  async getSystemStats(): Promise<SystemStats>;

  /**
   * 检查模型是否已训练
   */
  isModelTrained(major?: string): boolean;
}
```

#### 4.2.3 生成流程

```
generateTopics(params)
    │
    ├─→ 1. 检查模型是否训练
    │       ├─→ 已训练: 继续
    │       └─→ 未训练: 执行 trainModel()
    │
    ├─→ 2. 选择生成算法
    │       ├─→ 'markov': generateWithMarkov()
    │       ├─→ 'template': generateWithTemplate()
    │       └─→ 'hybrid': generateWithHybrid()
    │
    ├─→ 3. 质量评估和过滤
    │       └─→ TextProcessorService.assessQuality()
    │
    ├─→ 4. 保存生成历史 (异步)
    │       └─→ DataService.saveGeneratedTopics()
    │
    └─→ 5. 返回生成结果
            {
              topics: GeneratedTopic[],
              stats: GenerationStats
            }
```

#### 4.2.4 算法切换

```typescript
switch (params.algorithm) {
  case 'markov':
    // 纯马尔科夫链生成
    generatedTopics = await this.generateWithMarkov(params);
    break;

  case 'template':
    // 纯模板生成
    generatedTopics = await this.generateWithTemplate(params);
    break;

  case 'hybrid':
    // 混合生成: 50% 马尔科夫 + 50% 模板
    const markovCount = Math.ceil(params.count / 2);
    const templateCount = params.count - markovCount;

    const [markovTopics, templateTopics] = await Promise.all([
      this.generateWithMarkov({ ...params, count: markovCount }),
      this.generateWithTemplate({ ...params, count: templateCount }),
    ]);

    generatedTopics = [...markovTopics, ...templateTopics];
    break;
}
```

### 4.3 MarkovChainService

马尔科夫链生成服务，基于概率转移模型生成文本。

**文件位置**: `src/lib/services/markov-chain.service.ts`

#### 4.3.1 数据结构

```typescript
class MarkovChainService {
  // 通用转移表: 当前词 → { 下一词: 频率 }
  private transitionTable: Map<string, Map<string, number>>;

  // 开始词集合: { 词: 频率 }
  private startTokens: Map<string, number>;

  // 结束词集合: { 词: 频率 }
  private endTokens: Set<string>;

  // 专业特定模型
  private majorSpecificChains: Map<
    string,
    {
      transitionTable: Map<string, Map<string, number>>;
      startTokens: Map<string, number>;
      endTokens: Set<string>;
    }
  >;
}
```

#### 4.3.2 训练流程

```
train(topics: TopicData[])
    │
    ├─→ 1. 按专业分组题目
    │       groupBy(topic => topic.major)
    │
    ├─→ 2. 构建通用模型
    │       ├─→ 遍历所有题目
    │       ├─→ 分词: TextProcessorService.tokenize()
    │       ├─→ 构建转移表
    │       │       for i in range(len(tokens) - 1):
    │       │           transitionTable[tokens[i]][tokens[i+1]]++
    │       ├─→ 记录开始词
    │       │       startTokens[tokens[0]]++
    │       └─→ 记录结束词
    │               endTokens.add(tokens[-1])
    │
    ├─→ 3. 构建专业特定模型
    │       for major in majors:
    │           majorSpecificChains[major] = buildChain(topics[major])
    │
    └─→ 4. 持久化到数据库
            saveToDatabase()
```

#### 4.3.3 生成流程

```
generate(params: GenerationParams): GeneratedTopic[]
    │
    ├─→ 1. 选择模型
    │       params.major ? majorSpecificChains[major] : transitionTable
    │
    ├─→ 2. 批量生成候选 (目标数量 × 2)
    │       for i in range(params.count * 2):
    │           candidate = generateSingle()
    │
    ├─→ 3. 生成单个选题
    │       generateSingle():
    │           ├─→ 选择开始词 (加权随机)
    │           ├─→ 循环生成下一个词
    │           │       while not isEndToken(currentWord):
    │           │           nextWord = sampleNextWord(currentWord)
    │           ├─→ 检查长度约束 (5-20 词)
    │           └─→ 组装成完整题目
    │
    ├─→ 4. 质量评估
    │       for topic in candidates:
    │           topic.quality = TextProcessorService.assessQuality(topic)
    │
    ├─→ 5. 排序和筛选
    │       candidates.sort(by: quality, desc)
    │       return candidates.slice(0, params.count)
    │
    └─→ 6. Fallback 补充
            if result.length < params.count:
                补充生成更多候选
```

#### 4.3.4 概率采样

```typescript
sampleNextWord(currentWord: string): string {
  const transitions = this.transitionTable.get(currentWord);
  if (!transitions) return null;

  // 计算总频率
  const total = Array.from(transitions.values()).reduce((a, b) => a + b, 0);

  // 加权随机采样
  let random = Math.random() * total;
  for (const [word, freq] of transitions) {
    random -= freq;
    if (random <= 0) return word;
  }

  return transitions.keys().next().value;
}
```

### 4.4 TemplateGeneratorService

模板生成服务，基于预定义模板和词汇库生成选题。

**文件位置**: `src/lib/services/template-generator.service.ts`

#### 4.4.1 模板库结构

```typescript
// 通用模板 (10 个)
const GENERAL_TEMPLATES = [
  '基于{tech}的{domain}{system}',
  '{tech}在{domain}中的{application}',
  '智能{domain}{management}系统',
  '{platform}平台下的{domain}{solution}',
  '面向{target}的{domain}{system}',
  '基于{algorithm}的{problem}{solution}',
  '{industry}{management}系统的设计与实现',
  '{scenario}场景下的{domain}{application}',
  '多{feature}融合的{domain}{system}',
  '{tech}驱动的{domain}{innovation}',
];

// 专业特定模板
const MAJOR_TEMPLATES = {
  计算机科学与技术: [
    '基于{algorithm}的{problem}{solution}',
    '{dataStructure}在{scenario}中的{application}',
    '分布式{system}的设计与优化',
    '{protocol}协议的{improvement}与实现',
    '高性能{component}的研究与设计',
  ],
  软件工程: [
    '基于{methodology}的{software}{development}',
    '{architecture}架构在{domain}中的应用',
    '{testing}测试框架的设计与实现',
    '敏捷{process}在{project}中的实践',
    '代码{quality}分析工具的研究',
  ],
  // ... 更多专业模板
};
```

#### 4.4.2 词汇库

```typescript
const VOCABULARY = {
  tech: [
    '大数据',
    '人工智能',
    '机器学习',
    '深度学习',
    '云计算',
    '区块链',
    '物联网',
    '边缘计算',
    '5G',
    '微服务',
  ],

  algorithm: [
    '遗传算法',
    '粒子群',
    '蚁群算法',
    'K-means',
    'SVM',
    '神经网络',
    '决策树',
    '随机森林',
    'LSTM',
    'Transformer',
  ],

  domain: [
    '教育',
    '医疗',
    '金融',
    '电商',
    '物流',
    '农业',
    '制造',
    '能源',
    '交通',
    '安防',
  ],

  system: [
    '管理系统',
    '分析平台',
    '监控系统',
    '推荐系统',
    '预测系统',
    '决策系统',
    '调度系统',
  ],

  application: [
    '应用研究',
    '实践探索',
    '创新应用',
    '融合应用',
    '智能应用',
    '优化应用',
  ],

  // ... 30+ 词汇类别
};
```

#### 4.4.3 生成流程

```
generate(params: GenerationParams): GeneratedTopic[]
    │
    ├─→ 1. 选择模板集
    │       params.major in MAJOR_TEMPLATES
    │           ? MAJOR_TEMPLATES[major]
    │           : GENERAL_TEMPLATES
    │
    ├─→ 2. 批量生成
    │       for i in range(params.count):
    │           ├─→ 随机选择模板
    │           ├─→ 解析占位符
    │           ├─→ 填充词汇
    │           └─→ 组装成完整题目
    │
    ├─→ 3. 占位符填充
    │       fillTemplate(template):
    │           for placeholder in template.match(/{(\w+)}/g):
    │               word = randomChoice(VOCABULARY[placeholder])
    │               template.replace(placeholder, word)
    │
    └─→ 4. 返回生成结果
```

### 4.5 TextProcessorService

文本处理服务，负责中文分词、关键词提取和质量评估。

**文件位置**: `src/lib/services/text-processor.service.ts`

#### 4.5.1 核心功能

| 功能       | 方法                                      | 说明                  |
| ---------- | ----------------------------------------- | --------------------- |
| 中文分词   | `tokenize(text)`                          | 使用 nodejieba 分词   |
| 关键词提取 | `extractKeywords(text, topK)`             | TF-IDF + 技术术语加权 |
| 质量评估   | `assessQuality(topic, major)`             | 多因子加权评分        |
| 批量处理   | `batchProcessForTraining(titles, majors)` | 高性能批量处理        |

#### 4.5.2 分词流程

```typescript
tokenize(text: string): string[] {
  // 1. 文本清洗
  const cleanedText = this.cleanText(text);

  // 2. 基础分词
  const words = nodejieba.cut(cleanedText);

  // 3. 关键词补充 (TF-IDF)
  const keywords = nodejieba.extract(cleanedText, 10);
  const keywordSet = new Set(keywords.map(k => k.word));

  // 4. 过滤
  return words.filter(word => {
    // 长度检查
    if (word.length < 2) return false;

    // 停用词检查
    if (STOP_WORDS.has(word)) return false;

    // 标点符号检查
    if (/^[\p{P}\p{S}]+$/u.test(word)) return false;

    // 纯数字检查
    if (/^\d+$/.test(word)) return false;

    return true;
  });
}
```

#### 4.5.3 质量评估模型

```
总分 = 基础分(0.3) + 长度分(0.3) + 技术术语分(0.4)
     + 基础术语分(0.2) + 结构分(0.1) + 唯一性分(0.1)

评分范围: 0.0 - 5.0
```

```typescript
assessQuality(topic: string, major?: string): number {
  let score = 0;
  const tokens = this.tokenize(topic);

  // 1. 基础分 (0-0.3)
  score += 0.3;

  // 2. 长度分 (0-0.3)
  const length = topic.length;
  if (length >= 10 && length <= 50) {
    score += 0.3;
  } else if (length >= 5 && length <= 60) {
    score += 0.15;
  }

  // 3. 技术术语分 (0-0.4)
  const techTermCount = tokens.filter(t => TECH_DICT.includes(t)).length;
  score += Math.min(techTermCount * 0.1, 0.4);

  // 4. 基础术语分 (0-0.2)
  const basicTerms = ['系统', '设计', '研究', '分析', '实现', '应用'];
  const hasBasicTerm = tokens.some(t => basicTerms.includes(t));
  if (hasBasicTerm) score += 0.2;

  // 5. 结构分 (0-0.1)
  const hasStructure = topic.includes('基于') ||
                       topic.includes('的') ||
                       topic.includes('与');
  if (hasStructure) score += 0.1;

  // 6. 唯一性分 (0-0.1)
  const uniqueTokens = new Set(tokens);
  if (uniqueTokens.size / tokens.length > 0.8) {
    score += 0.1;
  }

  return Math.min(score, 5.0);
}
```

#### 4.5.4 批量处理优化

```typescript
async batchProcessForTraining(
  titles: string[],
  majors: string[]
): Promise<ProcessedData[]> {
  // 预计算技术词典集合 (避免重复数组查询)
  const techTermsSet = new Set(TECH_DICT);
  const stopWordsSet = new Set(STOP_WORDS);

  const results: ProcessedData[] = [];
  const total = titles.length;
  let lastProgress = 0;

  for (let i = 0; i < total; i++) {
    // 优化的分词 (不使用完整的 nodejieba 调用)
    const tokens = this.tokenizeOptimized(titles[i], stopWordsSet);

    // 优化的质量评估 (使用预计算集合)
    const quality = this.assessQualityOptimized(
      tokens, majors[i], techTermsSet
    );

    results.push({ tokens, quality, major: majors[i] });

    // 进度报告 (5% 间隔)
    const progress = Math.floor((i / total) * 20) * 5;
    if (progress > lastProgress) {
      console.log(`处理进度: ${progress}%`);
      lastProgress = progress;
    }
  }

  return results;
}
// 处理速度: ~1000-3000 题目/秒
```

### 4.6 MajorService

专业管理服务，处理专业相关的数据和统计。

**文件位置**: `src/lib/services/major.service.ts`

#### 4.6.1 核心功能

| 功能         | 方法                          | 说明                 |
| ------------ | ----------------------------- | -------------------- |
| 获取专业列表 | `getAllMajors()`              | 返回所有专业信息     |
| 获取专业统计 | `getMajorStats(major)`        | 返回专业的详细统计   |
| 同步专业信息 | `syncMajorInfoFromTopics()`   | 从题目表同步专业数据 |
| 更新训练状态 | `updateTrainingStatus(major)` | 更新模型训练状态     |

#### 4.6.2 数据来源

```typescript
// 双轨数据获取
async getAllMajors(): Promise<MajorInfo[]> {
  // 方式1: 从题目表动态统计
  const topicStats = await this.prisma.graduationTopic.groupBy({
    by: ['major'],
    _count: { id: true },
    where: { major: { not: null } },
  });

  // 方式2: 从专业表获取元数据
  const majorRecords = await this.prisma.major.findMany();

  // 合并数据
  return this.mergeMajorData(topicStats, majorRecords);
}
```

### 4.7 DataService

数据持久化服务，处理生成结果的存储和查询。

**文件位置**: `src/lib/services/data.service.ts`

#### 4.7.1 核心功能

| 功能         | 方法                                 | 说明               |
| ------------ | ------------------------------------ | ------------------ |
| 保存生成会话 | `saveGenerationSession(result)`      | 保存完整生成结果   |
| 获取生成会话 | `getGenerationSession(id)`           | 根据 ID 获取会话   |
| 获取最近会话 | `getRecentGenerationSessions(limit)` | 获取最近的生成历史 |
| 保存生成题目 | `saveGeneratedTopics(topics)`        | 保存单个生成题目   |

#### 4.7.2 会话数据结构

```typescript
interface GenerationSession {
  id: string;
  topics: GeneratedTopic[]; // 生成的题目列表
  algorithm: Algorithm; // 使用的算法
  params: GenerationParams; // 生成参数
  stats: GenerationStats; // 生成统计
  createdAt: Date;
  expiresAt: Date; // 过期时间 (用于清理)
}

interface GenerationStats {
  totalGenerated: number; // 总生成数
  validTopics: number; // 有效题目数
  averageQuality: number; // 平均质量分
  generationTime: number; // 生成耗时 (ms)
  algorithm: string; // 算法名称
  fallbackUsed: boolean; // 是否使用了 fallback
}
```

---

## 5. 数据库设计

### 5.1 ER 图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GraduationTopic                              │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ title         │ String                                        │   │
│  │ school        │ String?                                       │   │
│  │ major         │ String?                                       │   │
│  │ year          │ Int?                                          │   │
│  │ keywords      │ String? (JSON)                                │   │
│  │ processed     │ Boolean                                       │   │
│  │ createdAt     │ DateTime                                      │   │
│  │ updatedAt     │ DateTime                                      │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
│                                │                                     │
│                                │ 1:N                                 │
│                                ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      TokenizedWord                             │  │
│  │  ┌───────────────┬──────────────────────────────────────────┐ │  │
│  │  │ id            │ String (PK, CUID)                         │ │  │
│  │  │ topicId       │ String (FK → GraduationTopic)             │ │  │
│  │  │ word          │ String                                    │ │  │
│  │  │ position      │ Int                                       │ │  │
│  │  │ frequency     │ Int                                       │ │  │
│  │  └───────────────┴──────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       GenerationSession                              │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ topics        │ String (JSON Array)                           │   │
│  │ algorithm     │ String                                        │   │
│  │ params        │ String (JSON)                                 │   │
│  │ stats         │ String (JSON)                                 │   │
│  │ createdAt     │ DateTime                                      │   │
│  │ expiresAt     │ DateTime                                      │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        GeneratedTopic                                │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ content       │ String                                        │   │
│  │ algorithm     │ String                                        │   │
│  │ params        │ Json?                                         │   │
│  │ rating        │ Int? (1-5)                                    │   │
│  │ createdAt     │ DateTime                                      │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         MarkovChain                                  │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ currentWord   │ String (UK with nextWord)                     │   │
│  │ nextWord      │ String (UK with currentWord)                  │   │
│  │ frequency     │ Int                                           │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      MajorMarkovChain                                │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ major         │ String (UK with currentWord, nextWord)        │   │
│  │ currentWord   │ String                                        │   │
│  │ nextWord      │ String                                        │   │
│  │ frequency     │ Int                                           │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                            Major                                     │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ name          │ String (Unique)                               │   │
│  │ displayName   │ String?                                       │   │
│  │ category      │ String?                                       │   │
│  │ description   │ String?                                       │   │
│  │ sampleCount   │ Int                                           │   │
│  │ hasModel      │ Boolean                                       │   │
│  │ lastTrainingAt│ DateTime?                                     │   │
│  │ qualityStats  │ Json?                                         │   │
│  │ keywords      │ Json?                                         │   │
│  │ createdAt     │ DateTime                                      │   │
│  │ updatedAt     │ DateTime                                      │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        KeywordStats                                  │
│  ┌───────────────┬──────────────────────────────────────────────┐   │
│  │ id            │ String (PK, CUID)                             │   │
│  │ keyword       │ String (Unique)                               │   │
│  │ frequency     │ Int                                           │   │
│  │ category      │ String?                                       │   │
│  │ updatedAt     │ DateTime                                      │   │
│  └───────────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 模型详解

#### 5.2.1 GraduationTopic (毕业设计题目)

存储原始的毕业设计题目数据。

| 字段      | 类型     | 说明               |
| --------- | -------- | ------------------ |
| id        | String   | 主键，CUID 格式    |
| title     | String   | 题目标题           |
| school    | String?  | 学校名称           |
| major     | String?  | 专业名称           |
| year      | Int?     | 年份               |
| keywords  | String?  | 关键词 (JSON 数组) |
| processed | Boolean  | 是否已处理         |
| createdAt | DateTime | 创建时间           |
| updatedAt | DateTime | 更新时间           |

**唯一约束**: `[title, school, major, year]`

#### 5.2.2 MarkovChain (马尔科夫链)

存储通用的词语转移关系。

| 字段        | 类型   | 说明            |
| ----------- | ------ | --------------- |
| id          | String | 主键，CUID 格式 |
| currentWord | String | 当前词          |
| nextWord    | String | 下一个词        |
| frequency   | Int    | 转移频率        |

**唯一约束**: `[currentWord, nextWord]`

#### 5.2.3 MajorMarkovChain (专业马尔科夫链)

存储专业特定的词语转移关系。

| 字段        | 类型   | 说明            |
| ----------- | ------ | --------------- |
| id          | String | 主键，CUID 格式 |
| major       | String | 专业名称        |
| currentWord | String | 当前词          |
| nextWord    | String | 下一个词        |
| frequency   | Int    | 转移频率        |

**唯一约束**: `[major, currentWord, nextWord]`

#### 5.2.4 Major (专业信息)

存储专业元数据和统计信息。

| 字段           | 类型      | 说明            |
| -------------- | --------- | --------------- |
| id             | String    | 主键，CUID 格式 |
| name           | String    | 专业名称 (唯一) |
| displayName    | String?   | 显示名称        |
| category       | String?   | 专业类别        |
| description    | String?   | 专业描述        |
| sampleCount    | Int       | 样本数量        |
| hasModel       | Boolean   | 是否有训练模型  |
| lastTrainingAt | DateTime? | 最后训练时间    |
| qualityStats   | Json?     | 质量统计信息    |
| keywords       | Json?     | 专业关键词      |

### 5.3 数据库迁移

#### 5.3.1 开发环境

```bash
# 推送 Schema 变更到数据库 (不创建迁移文件)
npm run db:push

# 创建迁移文件
npm run db:migrate

# 重置数据库
npm run db:reset

# 打开 Prisma Studio
npm run db:studio
```

#### 5.3.2 生产环境

```bash
# 部署迁移
npm run db:deploy
```

### 5.4 数据导入导出

```bash
# 导入示例数据 (1,000 条)
npm run data:import

# 导入完整数据 (25,102 条)
npm run data:import:full

# 强制导入 (覆盖现有数据)
npm run data:import:force

# 导出数据库
npm run data:export
```

---

## 6. 前端架构

### 6.1 路由结构

```
src/app/
├── layout.tsx                    # 根布局
├── page.tsx                      # 首页 (/)
├── globals.css                   # 全局样式
│
├── generate/                     # 生成页面
│   ├── page.tsx                  # 服务端组件
│   ├── generate-client.tsx       # 客户端表单
│   ├── history.tsx               # 历史记录
│   ├── actions.ts                # Server Actions
│   └── result/
│       └── [sessionId]/          # 动态路由
│           ├── page.tsx          # 结果页面
│           ├── copy-button.tsx   # 复制按钮
│           └── not-found.tsx     # 404 处理
│
├── topics/                       # 选题库
│   ├── page.tsx                  # 服务端组件
│   ├── topics-client.tsx         # 客户端搜索
│   └── actions.ts                # Server Actions
│
└── api/                          # API 路由
    ├── generate/route.ts         # POST /api/generate
    └── topics/route.ts           # GET /api/topics
```

### 6.2 组件架构

#### 6.2.1 组件类型

| 类型       | 标识           | 用途          | 示例                  |
| ---------- | -------------- | ------------- | --------------------- |
| 服务端组件 | 默认           | 数据获取、SEO | `page.tsx`            |
| 客户端组件 | `'use client'` | 交互、状态    | `generate-client.tsx` |
| 布局组件   | `layout.tsx`   | 页面结构      | 导航栏、Footer        |
| UI 组件    | -              | 可复用 UI     | `Button`, `Card`      |

#### 6.2.2 组件树

```
RootLayout (layout.tsx)
├── ThemeProvider
│   ├── Navigation
│   └── main
│       ├── HomePage (/)
│       │
│       ├── GeneratePage (/generate)
│       │   ├── Tabs
│       │   │   ├── GenerateClient (表单)
│       │   │   │   ├── SearchableSelect (专业)
│       │   │   │   ├── SearchableSelect (年份)
│       │   │   │   ├── Select (算法)
│       │   │   │   ├── Select (数量)
│       │   │   │   └── Button (提交)
│       │   │   │
│       │   │   └── History (历史)
│       │   │       └── SessionCard[]
│       │   │
│       │   └── ResultPage (/generate/result/[id])
│       │       ├── Stats Card
│       │       └── Topics List
│       │           └── TopicItem
│       │               └── CopyButton
│       │
│       └── TopicsPage (/topics)
│           ├── SearchForm
│           └── TopicsList
│               ├── TopicItem[]
│               └── Pagination
│
└── Toaster (sonner)
```

### 6.3 UI 组件库

基于 shadcn/ui (Radix UI 底层):

| 组件             | 文件                    | 用途         |
| ---------------- | ----------------------- | ------------ |
| Button           | `button.tsx`            | 按钮         |
| Card             | `card.tsx`              | 卡片容器     |
| Input            | `input.tsx`             | 文本输入     |
| Label            | `label.tsx`             | 表单标签     |
| Select           | `select.tsx`            | 选择框       |
| SearchableSelect | `searchable-select.tsx` | 可搜索选择框 |
| Tabs             | `tabs.tsx`              | 标签页       |
| Dialog           | `dialog.tsx`            | 对话框       |
| Popover          | `popover.tsx`           | 弹出框       |
| DropdownMenu     | `dropdown-menu.tsx`     | 下拉菜单     |
| Command          | `command.tsx`           | 命令面板     |
| Alert            | `alert.tsx`             | 警告框       |
| Badge            | `badge.tsx`             | 徽章         |
| Tooltip          | `tooltip.tsx`           | 工具提示     |
| Pagination       | `pagination.tsx`        | 分页         |

### 6.4 状态管理

#### 6.4.1 状态层次

| 层级   | 位置       | 管理方式       | 示例     |
| ------ | ---------- | -------------- | -------- |
| 页面级 | `page.tsx` | 服务端直接查询 | 初始数据 |
| 组件级 | 客户端组件 | `useState`     | 表单状态 |
| 服务端 | DI 容器    | 单例模式       | 服务实例 |

#### 6.4.2 数据流向

```
┌─────────────────────────────────────────────┐
│ 服务端组件 (page.tsx)                       │
│ - 异步获取初始数据                          │
│ - 传递 Props 给客户端组件                   │
└────────────┬────────────────────────────────┘
             │ Props
             ▼
┌─────────────────────────────────────────────┐
│ 客户端组件 (generate-client.tsx)            │
│ - useState 管理表单状态                     │
│ - useState 管理加载状态                     │
└────────────┬────────────────────────────────┘
             │ fetch / Server Action
             ▼
┌─────────────────────────────────────────────┐
│ API Route / Server Action                    │
│ - 验证请求                                  │
│ - 调用服务层                                │
│ - 返回响应                                  │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 服务层                                       │
│ - 执行业务逻辑                              │
│ - 访问数据库                                │
└─────────────────────────────────────────────┘
```

### 6.5 样式系统

#### 6.5.1 Tailwind CSS v4

```css
/* src/app/globals.css */
@import 'tailwindcss';
@import 'tw-animate-css';

/* 主题变量 */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --muted: oklch(0.97 0 0);
  --accent: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... 深色模式变量 */
}
```

#### 6.5.2 响应式设计

| 断点 | 宽度   | 用途     |
| ---- | ------ | -------- |
| sm   | 640px  | 手机横屏 |
| md   | 768px  | 平板     |
| lg   | 1024px | 小屏桌面 |
| xl   | 1280px | 标准桌面 |
| 2xl  | 1536px | 大屏桌面 |

```typescript
// 使用示例
className = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
className = 'text-sm lg:text-lg';
className = 'hidden md:flex';
```

---

## 7. API 参考

### 7.1 POST /api/generate

生成选题。

#### 请求

```http
POST /api/generate
Content-Type: application/json

{
  "major": "计算机科学与技术",
  "year": "2024",
  "algorithm": "markov",
  "count": 5
}
```

| 参数      | 类型   | 必需 | 说明                                 |
| --------- | ------ | ---- | ------------------------------------ |
| major     | string | 否   | 专业名称                             |
| year      | string | 否   | 参考年份                             |
| algorithm | enum   | 是   | 算法: `markov`, `template`, `hybrid` |
| count     | number | 是   | 生成数量 (1-50)                      |

#### 响应

**成功 (200)**:

```json
{
  "success": true,
  "sessionId": "clxxx123",
  "message": "生成成功"
}
```

**失败 (400/500)**:

```json
{
  "success": false,
  "error": "生成失败：未能生成任何有效题目"
}
```

### 7.2 GET /api/topics

搜索选题库。

#### 请求

```http
GET /api/topics?search=机器学习&major=计算机&page=1&pageSize=10
```

| 参数     | 类型   | 必需 | 说明                     |
| -------- | ------ | ---- | ------------------------ |
| search   | string | 否   | 搜索关键词               |
| major    | string | 否   | 专业筛选                 |
| year     | number | 否   | 年份筛选                 |
| page     | number | 否   | 页码 (默认 1)            |
| pageSize | number | 否   | 每页数量 (1-50, 默认 10) |

#### 响应

**成功 (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx123",
      "title": "基于机器学习的图像识别系统",
      "school": "清华大学",
      "major": "计算机科学与技术",
      "year": 2024,
      "keywords": "[\"机器学习\", \"图像识别\"]",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 7.3 错误码

| 状态码 | 说明           |
| ------ | -------------- |
| 200    | 成功           |
| 400    | 请求参数错误   |
| 404    | 资源不存在     |
| 500    | 服务器内部错误 |

---

## 8. 开发指南

### 8.1 环境准备

#### 8.1.1 系统要求

- Node.js 18+
- npm 8+
- Git

#### 8.1.2 推荐 IDE

- VS Code
- 推荐扩展:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Prisma

### 8.2 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/your-org/topicforge.git
cd topicforge

# 2. 安装依赖
npm install

# 3. 初始化数据库
npm run setup:db:dev

# 4. 导入示例数据
npm run data:import

# 5. 启动开发服务器
npm run dev
```

### 8.3 常用命令

#### 8.3.1 开发

```bash
npm run dev              # 启动开发服务器 (Turbopack)
npm run build            # 生产构建 (Webpack)
npm run start            # 运行生产服务器
```

#### 8.3.2 代码质量

```bash
npm run lint             # ESLint 检查
npm run lint:fix         # ESLint 自动修复
npm run format           # Prettier 格式化
npm run format:check     # Prettier 检查
npm run type-check       # TypeScript 类型检查
```

#### 8.3.3 测试

```bash
npm test                 # 运行所有测试
npm run test:watch       # 监听模式
npm run test:coverage    # 生成覆盖率报告
npm run test:unit        # 仅单元测试
npm run test:integration # 仅集成测试
```

#### 8.3.4 数据库

```bash
npm run db:generate      # 生成 Prisma Client
npm run db:push          # 推送 Schema 变更
npm run db:migrate       # 创建迁移
npm run db:studio        # 打开 Prisma Studio
```

#### 8.3.5 数据处理

```bash
npm run data:import      # 导入示例数据
npm run data:import:full # 导入完整数据
npm run data:export      # 导出数据
npm run crawler          # 运行爬虫
npm run train            # 训练模型
```

### 8.4 编码规范

#### 8.4.1 命名约定

| 类型      | 风格                 | 示例                         |
| --------- | -------------------- | ---------------------------- |
| 类/接口   | PascalCase           | `TopicGeneratorService`      |
| 函数/变量 | camelCase            | `generateTopics`             |
| 文件名    | kebab-case           | `topic-generator.service.ts` |
| 常量      | SCREAMING_SNAKE_CASE | `MAX_TOPICS`                 |

#### 8.4.2 TypeScript 规范

```typescript
// 使用明确的返回类型
function generateTopic(params: GenerationParams): Promise<GeneratedTopic[]> {
  // ...
}

// 避免使用 any
function process(data: unknown): Result<ProcessedData, ProcessError> {
  // ...
}

// 使用 Result 类型处理错误
async function fetchData(): Promise<Result<Data, Error>> {
  try {
    const data = await fetch('/api/data');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

#### 8.4.3 文件组织

```typescript
// 导入顺序
// 1. 外部依赖
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 2. 内部模块 (使用 @/ 别名)
import { topicGeneratorService } from '@/lib/services';
import type { GenerationParams } from '@/lib/interfaces';

// 3. 相对导入
import { validateRequest } from './utils';
```

### 8.5 Git 工作流

#### 8.5.1 提交规范

使用 Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:

| 类型     | 说明     |
| -------- | -------- |
| feat     | 新功能   |
| fix      | Bug 修复 |
| docs     | 文档更新 |
| style    | 代码格式 |
| refactor | 重构     |
| perf     | 性能优化 |
| test     | 测试     |
| build    | 构建系统 |
| ci       | CI 配置  |
| chore    | 其他     |
| revert   | 回滚     |

**示例**:

```bash
feat(generate): 添加混合生成算法支持

- 实现 50% 马尔科夫 + 50% 模板的混合生成
- 添加算法选择器组件
- 更新 API 文档

Closes #123
```

#### 8.5.2 分支策略

```
main                    # 生产分支
├── develop             # 开发分支
├── feature/xxx         # 功能分支
├── fix/xxx             # 修复分支
└── release/x.x.x       # 发布分支
```

---

## 9. 测试指南

### 9.1 测试架构

```
test/
├── unit/                   # 单元测试
│   ├── services/           # 服务测试
│   └── utils/              # 工具函数测试
│
├── integration/            # 集成测试
│   ├── repositories/       # Repository 测试
│   └── api/                # API 测试
│
├── components/             # 组件测试
│   └── ui/                 # UI 组件测试
│
├── e2e/                    # E2E 测试
│   ├── home.spec.ts
│   ├── generate.spec.ts
│   └── topics.spec.ts
│
├── utils/                  # 测试工具
│   └── test-helpers.ts
│
├── setup.ts                # 全局设置
└── integration/
    └── setup.ts            # 集成测试设置
```

### 9.2 单元测试

```typescript
// test/unit/services/text-processor.test.ts
import { textProcessor } from '@/lib/services';

describe('TextProcessorService', () => {
  describe('tokenize', () => {
    it('should tokenize Chinese text correctly', () => {
      const result = textProcessor.tokenize('基于机器学习的图像识别');

      expect(result).toContain('机器学习');
      expect(result).toContain('图像识别');
    });

    it('should filter stop words', () => {
      const result = textProcessor.tokenize('这是一个测试');

      expect(result).not.toContain('这');
      expect(result).not.toContain('是');
      expect(result).not.toContain('一个');
    });
  });

  describe('assessQuality', () => {
    it('should return score between 0 and 5', () => {
      const score = textProcessor.assessQuality('基于深度学习的图像识别系统');

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(5);
    });
  });
});
```

### 9.3 集成测试

```typescript
// test/integration/repositories/graduation-topic.test.ts
import {
  getGraduationTopicRepository,
  resetContainer,
} from '@/lib/core/container';

describe('GraduationTopicRepository', () => {
  let repo: IGraduationTopicRepository;

  beforeAll(() => {
    repo = getGraduationTopicRepository();
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.graduationTopic.deleteMany({
      where: { title: { startsWith: 'TEST_' } },
    });
  });

  afterAll(() => {
    resetContainer();
  });

  describe('findMany', () => {
    it('should return paginated results', async () => {
      const result = await repo.findMany({ page: 1, pageSize: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(10);
      }
    });
  });
});
```

### 9.4 组件测试

```typescript
// test/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### 9.5 E2E 测试

```typescript
// test/e2e/generate.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Generate Page', () => {
  test('should generate topics successfully', async ({ page }) => {
    // 1. 访问生成页面
    await page.goto('/generate');

    // 2. 选择算法
    await page.selectOption('[data-testid="algorithm-select"]', 'markov');

    // 3. 选择数量
    await page.selectOption('[data-testid="count-select"]', '5');

    // 4. 点击生成按钮
    await page.click('[data-testid="generate-button"]');

    // 5. 等待跳转到结果页面
    await expect(page).toHaveURL(/\/generate\/result\/.+/);

    // 6. 验证生成了 5 个题目
    const topics = page.locator('[data-testid="topic-item"]');
    await expect(topics).toHaveCount(5);
  });
});
```

### 9.6 覆盖率要求

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 10. 部署说明

### 10.1 环境配置

#### 10.1.1 环境变量

```bash
# .env.local (开发环境)
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# .env.production (生产环境)
DATABASE_URL="mysql://user:password@host:3306/topicforge"
NEXT_PUBLIC_API_URL="https://topicforge.example.com"
```

#### 10.1.2 必需变量

| 变量                | 说明             | 示例          |
| ------------------- | ---------------- | ------------- |
| DATABASE_URL        | 数据库连接字符串 | `mysql://...` |
| NEXT_PUBLIC_API_URL | API 基础 URL     | `https://...` |

### 10.2 开发环境部署

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run setup:db:dev

# 3. 导入数据
npm run data:import:full

# 4. 训练模型
npm run train

# 5. 启动开发服务器
npm run dev
```

### 10.3 生产环境部署

#### 10.3.1 构建

```bash
# 1. 安装依赖
npm ci

# 2. 生成 Prisma Client
npm run db:generate

# 3. 运行迁移
npm run db:deploy

# 4. 构建应用
npm run build
```

#### 10.3.2 运行

```bash
# 启动生产服务器
npm start

# 或使用 PM2
pm2 start npm --name "topicforge" -- start
```

#### 10.3.3 Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# 构建镜像
docker build -t topicforge .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  topicforge
```

### 10.4 Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

**vercel.json 配置**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

---

## 11. 最佳实践

### 11.1 性能优化

#### 11.1.1 数据库优化

```typescript
// 使用选择性字段查询
const topics = await prisma.graduationTopic.findMany({
  select: {
    id: true,
    title: true,
    major: true,
    // 避免查询不需要的字段
  },
});

// 使用并行查询
const [total, topics] = await Promise.all([
  prisma.graduationTopic.count({ where }),
  prisma.graduationTopic.findMany({ where, skip, take }),
]);

// 使用事务
await prisma.$transaction([
  prisma.markovChain.deleteMany(),
  prisma.markovChain.createMany({ data: chains }),
]);
```

#### 11.1.2 前端优化

```typescript
// 使用 Suspense 边界
<Suspense fallback={<Loading />}>
  <GenerateClient majors={majors} years={years} />
</Suspense>

// 使用 useCallback 避免重渲染
const handleSubmit = useCallback(async () => {
  // ...
}, [dependencies]);

// 使用 useMemo 缓存计算结果
const filteredTopics = useMemo(() => {
  return topics.filter(t => t.major === selectedMajor);
}, [topics, selectedMajor]);
```

### 11.2 安全最佳实践

#### 11.2.1 输入验证

```typescript
// 使用 Zod 进行严格验证
const schema = z.object({
  major: z.string().max(100).optional(),
  count: z.number().min(1).max(50),
  algorithm: z.enum(['markov', 'template', 'hybrid']),
});

const result = schema.safeParse(input);
if (!result.success) {
  throw new ValidationError(result.error.message);
}
```

#### 11.2.2 SQL 注入防护

```typescript
// 使用 Prisma 参数化查询 (自动防护)
const topics = await prisma.graduationTopic.findMany({
  where: {
    title: { contains: userInput }, // 自动转义
  },
});
```

#### 11.2.3 XSS 防护

```typescript
// React 自动转义
<div>{userContent}</div>  // 安全

// 避免使用 dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />  // 危险!
```

### 11.3 错误处理

```typescript
// 使用 Result 类型
async function generateTopics(): Promise<Result<Topic[], GenerationError>> {
  try {
    const topics = await service.generate();
    return { success: true, data: topics };
  } catch (error) {
    return {
      success: false,
      error: new GenerationError(error.message),
    };
  }
}

// 调用方处理
const result = await generateTopics();
if (!result.success) {
  // 优雅降级
  showError(result.error.message);
  return fallbackTopics;
}
return result.data;
```

### 11.4 日志记录

```typescript
// 使用结构化日志
console.log(
  JSON.stringify({
    level: 'info',
    message: 'Topics generated',
    count: topics.length,
    algorithm: params.algorithm,
    duration: Date.now() - startTime,
  })
);

// 错误日志
console.error(
  JSON.stringify({
    level: 'error',
    message: 'Generation failed',
    error: error.message,
    stack: error.stack,
    params,
  })
);
```

---

## 12. 故障排除

### 12.1 常见问题

#### 12.1.1 nodejieba 安装失败

**问题**: `npm install` 时 nodejieba 编译失败

**解决方案**:

```bash
# macOS
xcode-select --install

# Ubuntu
sudo apt-get install build-essential

# Windows
npm install --global windows-build-tools
```

#### 12.1.2 Prisma Client 未生成

**问题**: `Cannot find module '@prisma/client'`

**解决方案**:

```bash
npm run db:generate
```

#### 12.1.3 数据库连接失败

**问题**: `Can't reach database server`

**解决方案**:

1. 检查 `DATABASE_URL` 环境变量
2. 确保数据库服务正在运行
3. 检查网络连接和防火墙

#### 12.1.4 构建失败

**问题**: `next build` 失败

**解决方案**:

```bash
# 清理缓存
rm -rf .next node_modules/.cache

# 重新安装依赖
rm -rf node_modules
npm install

# 重新构建
npm run build
```

### 12.2 调试技巧

#### 12.2.1 开启详细日志

```bash
# Next.js 调试
DEBUG=* npm run dev

# Prisma 查询日志
# 在 prisma/schema.prisma 中:
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["tracing"]
}
```

#### 12.2.2 使用 Prisma Studio

```bash
npm run db:studio
```

#### 12.2.3 检查生成模型

```typescript
// 在服务中添加调试代码
console.log('Transition table size:', this.transitionTable.size);
console.log('Start tokens:', this.startTokens.size);
console.log('Major chains:', this.majorSpecificChains.size);
```

---

## 13. 附录

### 13.1 术语表

| 术语   | 说明                                            |
| ------ | ----------------------------------------------- |
| DI     | Dependency Injection，依赖注入                  |
| DDD    | Domain-Driven Design，领域驱动设计              |
| DTO    | Data Transfer Object，数据传输对象              |
| ORM    | Object-Relational Mapping，对象关系映射         |
| NLP    | Natural Language Processing，自然语言处理       |
| TF-IDF | Term Frequency-Inverse Document Frequency       |
| RSC    | React Server Components，React 服务端组件       |
| SSR    | Server-Side Rendering，服务端渲染               |
| ISR    | Incremental Static Regeneration，增量静态再生成 |

### 13.2 参考链接

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Prisma 文档](https://www.prisma.io/docs)
- [tsyringe 文档](https://github.com/microsoft/tsyringe)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [nodejieba 文档](https://github.com/yanyiwu/nodejieba)

### 13.3 更新日志

#### v1.0.0 (2025-12-02)

- 初始版本发布
- 支持马尔科夫链、模板和混合生成算法
- 支持 68 个专业的定制化生成
- 完整的选题库搜索功能
- 响应式 UI 设计

---

**文档维护**: TopicForge 开发团队

**最后更新**: 2025-12-02
