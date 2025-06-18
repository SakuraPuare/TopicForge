# TopicForge 测试指南

本目录包含了 TopicForge 项目的所有测试代码，使用现代 Jest 测试框架。

## 目录结构

```
test/
├── README.md                    # 本文档
├── setup.ts                     # 全局测试设置
├── utils/
│   └── test-helpers.ts         # 测试辅助工具函数
├── unit/                       # 单元测试
│   ├── text-processor.test.ts  # 文本处理器测试
│   ├── markov-chain.test.ts    # 马尔科夫链测试
│   └── template-generator.test.ts # 模板生成器测试
├── integration/                # 集成测试
│   ├── setup.ts               # 集成测试设置
│   └── topic-generation.test.ts # 主题生成集成测试
└── components/                 # 组件测试
    └── setup.ts               # 组件测试设置
```

## 测试分类

### 单元测试 (Unit Tests)

- 测试单个函数或类的功能
- 快速执行，不依赖外部服务
- 位于 `test/unit/` 目录

### 集成测试 (Integration Tests)

- 测试多个模块间的交互
- 可能涉及数据库操作
- 位于 `test/integration/` 目录

### 组件测试 (Component Tests)

- 测试 React 组件的渲染和交互
- 使用 Testing Library 进行 DOM 测试
- 位于 `test/components/` 目录

## 运行测试

```bash
# 运行所有测试
npm test

# 监视模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration

# CI 环境运行（无监视，生成覆盖率）
npm run test:ci
```

## 测试覆盖的功能模块

### 文本处理服务 (TextProcessorService)

- ✅ 中文分词功能
- ✅ 文本清洗
- ✅ 关键词提取
- ✅ 批量处理
- ✅ 质量评估

### 马尔科夫链服务 (MarkovChainService)

- ✅ 模型训练
- ✅ 序列生成
- ✅ 专业特定训练
- ✅ 统计信息获取

### 模板生成器 (TemplateGenerator)

- ✅ 模板题目生成
- ✅ 专业特定生成
- ✅ 质量验证
- ✅ 性能测试

### 主题生成服务集成

- ✅ 多算法生成
- ✅ 数据库集成
- ✅ 生成历史记录
- ✅ 系统统计

## 测试数据

测试使用独立的数据库文件，不会影响开发数据：

- 单元测试：内存数据或模拟数据
- 集成测试：`test-integration.db`

## 测试最佳实践

1. **独立性**：每个测试应该能独立运行
2. **清理**：每个测试后清理测试数据
3. **可读性**：使用描述性的测试名称
4. **覆盖率**：目标覆盖率 > 80%
5. **速度**：单元测试应该快速执行（< 100ms）

## Mock 和 Stub

- 数据库操作使用真实的 Prisma 客户端（测试数据库）
- 外部 API 调用会被 mock
- 文件系统操作使用临时文件

## 调试测试

```bash
# 运行特定测试文件
npx jest test/unit/text-processor.test.ts

# 运行特定测试用例
npx jest --testNamePattern="应该正确分词"

# 详细输出
npx jest --verbose
```

## 持续集成

测试在以下情况下自动运行：

- Git commit 前（pre-commit hook）
- CI/CD 流水线中
- Pull Request 时

## 贡献指南

添加新功能时请同时添加相应测试：

1. 单元测试覆盖核心逻辑
2. 集成测试覆盖模块交互
3. 边界条件和错误处理测试
4. 性能测试（如果适用）
