# 开发指南

## 工程规范工具

本项目配置了以下工程规范工具来确保代码质量和一致性：

### Prettier - 代码格式化

Prettier 用于自动格式化代码，确保代码风格的一致性。

```bash
# 检查代码格式
npm run format:check

# 自动格式化代码
npm run format
```

### ESLint - 代码质量检查

ESLint 用于检查代码质量和规范，识别潜在的问题。

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复可修复的问题
npm run lint:fix
```

### TypeScript - 类型检查

```bash
# 运行类型检查
npm run type-check
```

### Husky - Git Hooks

Husky 配置了以下 Git hooks：

- **pre-commit**: 在提交前运行 lint-staged，自动检查和修复暂存的文件
- **commit-msg**: 可用于验证提交消息格式（当前已配置但未启用）

### lint-staged - 暂存文件检查

lint-staged 只对暂存的文件运行检查，提高性能：

- 对 JS/TS 文件运行 ESLint 和 Prettier
- 对其他文件（JSON、MD、CSS 等）运行 Prettier

## 开发工作流

1. **编写代码**
2. **提交前检查**：

   ```bash
   # 手动运行所有检查
   npm run lint
   npm run format:check
   npm run type-check
   ```

3. **暂存文件**：

   ```bash
   git add .
   ```

4. **提交代码**：

   ```bash
   git commit -m "你的提交消息"
   ```

   提交时会自动运行 pre-commit hook，对暂存的文件进行检查和格式化。

## VS Code 配置

项目包含了 VS Code 的工作区配置：

- **自动格式化**：保存时自动运行 Prettier
- **ESLint 自动修复**：保存时自动修复 ESLint 问题
- **推荐扩展**：安装推荐的扩展来获得最佳开发体验

## 配置文件说明

- `.prettierrc` - Prettier 配置
- `.prettierignore` - Prettier 忽略文件
- `.editorconfig` - 编辑器配置
- `.vscode/settings.json` - VS Code 工作区设置
- `.vscode/extensions.json` - 推荐的 VS Code 扩展
- `.husky/` - Git hooks 配置
- `package.json` 中的 `lint-staged` - 暂存文件检查配置

## 故障排除

如果遇到问题，可以尝试：

1. **重新安装依赖**：

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **手动格式化所有文件**：

   ```bash
   npm run format
   ```

3. **检查 Husky 配置**：

   ```bash
   npx husky install
   ```
