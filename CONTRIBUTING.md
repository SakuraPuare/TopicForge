# 贡献指南

感谢你对 TopicForge 项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告 Bug
- 提交功能建议
- 提交代码修复
- 改进文档
- 添加测试用例

## 目录

1. [行为准则](#行为准则)
2. [开始之前](#开始之前)
3. [开发环境设置](#开发环境设置)
4. [开发工作流](#开发工作流)
5. [代码规范](#代码规范)
6. [提交规范](#提交规范)
7. [Pull Request 流程](#pull-request-流程)
8. [问题报告](#问题报告)

---

## 行为准则

参与本项目即表示你同意遵守以下行为准则：

- 尊重所有参与者
- 接受建设性的批评
- 关注项目的最佳利益
- 对社区成员表示同理心

---

## 开始之前

1. 确保你有一个 GitHub 账号
2. 检查 [Issues](https://github.com/your-org/topicforge/issues) 中是否已有相关问题
3. 如果是新功能，建议先创建 Issue 讨论

---

## 开发环境设置

### 系统要求

- Node.js 18+
- npm 8+
- Git

### 步骤

```bash
# 1. Fork 项目到你的 GitHub 账号

# 2. 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/topicforge.git
cd topicforge

# 3. 添加上游仓库
git remote add upstream https://github.com/your-org/topicforge.git

# 4. 安装依赖
npm install

# 5. 初始化数据库
npm run setup:db:dev

# 6. 导入示例数据
npm run data:import

# 7. 启动开发服务器
npm run dev

# 8. 访问 http://localhost:3000
```

### 验证安装

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint

# 运行测试
npm test
```

---

## 开发工作流

### 1. 同步上游代码

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. 创建功能分支

```bash
# 功能分支
git checkout -b feature/your-feature-name

# 修复分支
git checkout -b fix/bug-description
```

### 3. 开发和测试

```bash
# 开发时运行
npm run dev

# 运行测试
npm test

# 运行特定测试
npm run test:unit
npm run test:integration
npm run test:e2e
```

### 4. 提交代码

```bash
# 暂存更改
git add .

# 提交 (遵循提交规范)
git commit -m "feat: 添加新功能描述"
```

### 5. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

---

## 代码规范

### TypeScript

- 使用 TypeScript 严格模式
- 避免使用 `any` 类型，使用 `unknown` 替代
- 为函数添加明确的返回类型
- 使用 `Result<T>` 类型处理错误

```typescript
// 推荐
function fetchData(id: string): Promise<Result<Data, Error>> {
  // ...
}

// 不推荐
function fetchData(id: any): any {
  // ...
}
```

### 命名约定

| 类型      | 风格                 | 示例               |
| --------- | -------------------- | ------------------ |
| 类/接口   | PascalCase           | `TopicService`     |
| 函数/变量 | camelCase            | `generateTopic`    |
| 文件名    | kebab-case           | `topic-service.ts` |
| 常量      | SCREAMING_SNAKE_CASE | `MAX_COUNT`        |

### 文件组织

```typescript
// 导入顺序
// 1. 外部依赖
import { NextRequest } from 'next/server';

// 2. 内部模块 (@/ 别名)
import { service } from '@/lib/services';

// 3. 相对导入
import { helper } from './utils';
```

### 代码格式化

项目使用 Prettier 进行代码格式化，提交前会自动运行。

```bash
# 手动格式化
npm run format

# 检查格式
npm run format:check
```

---

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

| 类型     | 说明                  |
| -------- | --------------------- |
| feat     | 新功能                |
| fix      | Bug 修复              |
| docs     | 文档更新              |
| style    | 代码格式 (不影响功能) |
| refactor | 重构                  |
| perf     | 性能优化              |
| test     | 测试相关              |
| build    | 构建系统              |
| ci       | CI 配置               |
| chore    | 其他杂项              |
| revert   | 回滚                  |

### 示例

```bash
# 新功能
git commit -m "feat(generate): 添加混合生成算法"

# Bug 修复
git commit -m "fix(api): 修复分页参数验证错误"

# 文档更新
git commit -m "docs: 更新 API 文档"

# 带详细描述
git commit -m "feat(ui): 添加深色模式支持

- 添加主题切换组件
- 更新 CSS 变量
- 添加本地存储持久化

Closes #123"
```

### 提交检查

项目配置了 commitlint，不符合规范的提交会被拒绝：

```bash
# 错误示例 (会被拒绝)
git commit -m "fixed bug"

# 正确示例
git commit -m "fix: 修复登录页面样式问题"
```

---

## Pull Request 流程

### 1. 创建 PR 前检查

- [ ] 代码通过类型检查 (`npm run type-check`)
- [ ] 代码通过 lint 检查 (`npm run lint`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 新功能已添加测试
- [ ] 文档已更新 (如需要)

### 2. PR 标题

遵循提交规范：

```
feat(generate): 添加新的生成算法
fix(api): 修复搜索 API 返回错误
docs: 更新 README
```

### 3. PR 描述模板

```markdown
## 概述

简要描述这个 PR 做了什么。

## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性变更
- [ ] 文档更新

## 测试

描述如何测试这些变更。

## 相关 Issue

Closes #123

## 截图 (如适用)

添加相关截图。
```

### 4. 代码审查

- PR 需要至少一位维护者审查
- 请响应审查意见并进行必要的修改
- 所有 CI 检查必须通过

### 5. 合并

- PR 获批后由维护者合并
- 使用 Squash and merge 策略

---

## 问题报告

### Bug 报告

创建 Issue 时请包含：

1. **问题描述**: 清晰描述问题
2. **复现步骤**: 详细的复现步骤
3. **预期行为**: 你期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - 操作系统
   - Node.js 版本
   - 浏览器 (如适用)
6. **截图/日志**: 相关的截图或错误日志

### 功能建议

创建 Issue 时请包含：

1. **功能描述**: 清晰描述功能
2. **使用场景**: 为什么需要这个功能
3. **可能的实现方案**: 如果有的话

---

## 需要帮助？

- 查看 [技术文档](docs/TECHNICAL.md)
- 查看 [API 文档](docs/API.md)
- 在 Issue 中提问
- 联系维护者

---

再次感谢你的贡献！
