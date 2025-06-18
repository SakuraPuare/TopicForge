# 📦 TopicForge 数据包

本目录包含TopicForge项目的预导出数据，让用户可以快速开始使用系统，无需从零开始爬取和训练数据。

## 📋 数据统计

- **📚 毕业设计题目**: 25,102 条（样例版: 1,000 条）
- **🎓 专业数据**: 68 个专业
- **🔍 关键词统计**: 5,000 个高频关键词
- **🔗 马尔可夫链**: 10,000 个高频链条
- **🎯 专业马尔可夫链**: 10,000 个专业特定链条
- **✨ 生成题目样例**: 18 个AI生成的示例

## 📁 目录结构

```
data/
├── seeds/          # 种子数据（推荐用于快速开始）
│   ├── graduation-topics-sample.json     # 毕业设计题目样例 (1,000条)
│   ├── majors.json                       # 专业数据 (68条)
│   ├── keyword-stats.json                # 关键词统计 (5,000条)
│   ├── markov-chains.json                # 马尔可夫链数据 (10,000条)
│   ├── major-markov-chains.json          # 专业马尔可夫链 (10,000条)
│   └── metadata.json                     # 数据元信息
├── exports/        # 完整数据导出
│   ├── graduation-topics.json            # 完整毕业设计题目 (25,102条)
│   ├── majors.json                       # 专业数据
│   ├── keyword-stats.json                # 关键词统计
│   ├── markov-chains.json                # 马尔可夫链数据
│   ├── major-markov-chains.json          # 专业马尔可夫链数据
│   ├── generated-topics.json             # 生成题目样例
│   ├── metadata.json                     # 数据元信息
│   └── topicforge-data.sql               # SQL格式导出
└── README.md       # 本文档
```

## 🚀 快速使用

### 1. 导入种子数据（推荐新用户）

```bash
# 导入样例数据（1,000条题目）- 适合快速体验
npm run data:import

# 查看导入结果
npm run db:studio
```

### 2. 导入完整数据（适合生产环境）

```bash
# 导入完整数据（25,102条题目）
npm run data:import:full

# 强制覆盖现有数据
npm run data:import:force
```

### 3. 自定义导入

```bash
# 使用TypeScript脚本
npx tsx scripts/import-seeds.ts --full --force
```

## 🔧 可用命令

| 命令                        | 描述         | 数据量        |
| --------------------------- | ------------ | ------------- |
| `npm run data:import`       | 导入种子数据 | ~1,000条题目  |
| `npm run data:import:full`  | 导入完整数据 | ~25,000条题目 |
| `npm run data:import:force` | 强制覆盖导入 | 同上          |
| `npm run data:export`       | 导出当前数据 | 所有数据      |

## 📊 数据说明

### 毕业设计题目数据 (graduation-topics)

包含真实的毕业设计题目，字段包括：

- `title`: 题目标题
- `school`: 学校名称
- `major`: 专业名称
- `year`: 年份
- `keywords`: 关键词（JSON格式）
- `processed`: 是否已处理

### 专业数据 (majors)

包含专业信息，字段包括：

- `name`: 专业名称
- `displayName`: 显示名称
- `category`: 专业类别
- `sampleCount`: 样本数量
- `hasModel`: 是否有训练模型

### 关键词统计 (keyword-stats)

包含高频关键词统计：

- `keyword`: 关键词
- `frequency`: 出现频次
- `category`: 所属类别

### 马尔可夫链数据 (markov-chains)

包含词语转移概率：

- `currentWord`: 当前词
- `nextWord`: 下一个词
- `frequency`: 转移频次

### 专业马尔可夫链 (major-markov-chains)

包含专业特定的词语转移：

- `major`: 专业名称
- `currentWord`: 当前词
- `nextWord`: 下一个词
- `frequency`: 转移频次

## 🎯 使用建议

### 新用户开始

1. 首次使用推荐导入种子数据：`npm run data:import`
2. 启动开发服务器：`npm run dev`
3. 访问生成页面：<http://localhost:3000/generate>
4. 体验选题生成功能

### 生产环境部署

1. 导入完整数据：`npm run data:import:full`
2. 训练模型：`npm run train`
3. 构建项目：`npm run build`
4. 启动生产服务器：`npm start`

### 自定义训练

1. 使用完整数据：`npm run data:import:full`
2. 针对特定专业训练：`npm run train -- --major="计算机科学与技术"`
3. 测试生成效果

## ⚠️ 注意事项

1. **数据大小**: 完整数据包约14MB，请确保有足够存储空间
2. **内存使用**: 导入大量数据时可能需要较多内存
3. **导入时间**: 完整数据导入可能需要几分钟时间
4. **数据覆盖**: 使用`--force`参数会清空现有数据

## 🔄 数据更新

如果您有新的数据想要导出：

```bash
# 导出当前数据库数据
npm run data:export

# 数据将保存到 data/exports/ 和 data/seeds/ 目录
```

## 💡 常见问题

**Q: 导入失败怎么办？**
A: 检查数据库连接，确保已运行 `npm run setup:db:dev`

**Q: 数据太大怎么办？**
A: 使用样例数据 `npm run data:import`（仅1000条）

**Q: 如何重新导入？**
A: 使用 `npm run data:import:force` 强制覆盖

**Q: 生成效果不好？**
A: 尝试导入完整数据并重新训练模型

## 📞 支持

如果在使用数据包时遇到问题，请：

1. 查看项目主README文档
2. 提交GitHub Issue
3. 检查日志输出获取详细错误信息

---

_数据最后更新时间: 2024-06-18_
_数据版本: 1.0.0_
