# 超星系统爬虫使用指南

## 概述

这是一个专门针对超星学术文献系统的爬虫，能够自动抓取学术论文数据并存储到数据库中。

## 功能特性

- ✅ **API接口爬取**: 直接调用超星系统的REST API，效率高、稳定性好
- ✅ **数据解析**: 自动解析论文标题、作者、专业、院系、年份等信息
- ✅ **分页处理**: 支持批量爬取多页数据
- ✅ **去重存储**: 自动检测重复数据，避免重复保存
- ✅ **错误处理**: 完善的错误处理和重试机制
- ✅ **延迟控制**: 可配置请求间隔，避免被服务器限制

## 快速开始

### 1. 运行演示

```bash
# 运行爬虫演示脚本（推荐）
npm run crawler:demo
```

### 2. 直接运行爬虫

```bash
# 运行完整爬虫（会爬取所有页面）
npm run crawler:run
```

### 3. 代码使用示例

```typescript
import { ChaoxingCrawler } from './src/lib/crawler';

// 创建爬虫实例
const crawler = new ChaoxingCrawler({
  maxPages: 10, // 最多爬取10页
  pageSize: 10, // 每页10条数据
  delay: 2000, // 请求间隔2秒
  sorts: 'down___left_time', // 按年份降序排序
});

// 爬取单页数据
const result = await crawler.crawlPage(1);
console.log('爬取结果:', result);

// 批量爬取
const batchResult = await crawler.crawlAllPages(5);
console.log('批量爬取完成:', batchResult);
```

## 配置参数

### CrawlConfig 接口

```typescript
interface CrawlConfig {
  baseUrl?: string; // API基础地址，默认: 'https://4mdx2w4w.mh.chaoxing.com'
  wfwfid?: string; // 系统ID，默认: '22869'
  searchId?: string; // 搜索ID
  params?: string; // 额外参数
  maxPages?: number; // 最大爬取页数，默认: 50
  pageSize?: number; // 每页数据量，默认: 10
  delay?: number; // 请求间隔(毫秒)，默认: 1000
  sorts?: string; // 排序方式，默认: 'down___left_time'
}
```

### 排序选项

- `default` - 默认排序
- `down___left_time` - 年份降序
- `up___left_time` - 年份升序
- `down___show_page_view` - 浏览量降序
- `down___show_ref_count` - 被引量降序

## 数据结构

### 爬取的论文数据

```typescript
interface AcademicPaper {
  id: string; // 论文ID
  title: string; // 论文标题
  author?: string; // 作者
  studentId?: string; // 学号
  major?: string; // 专业
  department?: string; // 院系
  university?: string; // 学校
  year?: string; // 年份
  documentType?: string; // 文献类型
}
```

## 注意事项

### 1. 请求频率限制

为了避免被服务器封禁，建议：

- 设置合理的请求间隔（至少1秒）
- 不要同时运行多个爬虫实例
- 避免在高峰期进行大量爬取

### 2. 数据库准备

确保数据库已正确配置：

```bash
# 生成Prisma客户端
npx prisma generate

# 执行数据库迁移
npx prisma db push
```

### 3. 环境变量

在 `.env` 文件中配置数据库连接：

```env
DATABASE_URL="file:./dev.db"
```

## 高级功能

### 1. 按年份爬取

```typescript
// 爬取2024年的数据
const result = await crawler.crawlByYear('2024', 10);
```

### 2. 按专业爬取

```typescript
// 爬取计算机科学与技术专业的数据
const result = await crawler.crawlByMajor('计算机科学与技术', 10);
```

### 3. 自定义筛选

可以通过修改API请求参数来实现更复杂的筛选：

```typescript
// 在请求中添加搜索条件
const requestData = {
  page: page,
  pageSize: this.config.pageSize,
  wfwfid: this.config.wfwfid,
  sorts: { value: this.config.sorts },
  searchKeys: [
    {
      typeId: '88b01498-b3d6-4c2f-b2c9-bcd003ec2a3f',
      sw: '计算机科学与技术',
      matchType: 2,
      operator: 'and',
    },
  ],
};
```

## 问题排查

### 1. 网络连接问题

```
Error: connect ECONNREFUSED
```

**解决方案**: 检查网络连接和API地址是否正确

### 2. API参数错误

```
API返回错误: 参数错误
```

**解决方案**: 检查wfwfid、searchId等参数是否正确

### 3. 数据库连接问题

```
Error: Can't reach database server
```

**解决方案**: 检查DATABASE_URL配置和数据库状态

## API接口说明

### 请求地址

```
POST https://4mdx2w4w.mh.chaoxing.com/app/universal-search/search-list
```

### 请求参数

```json
{
  "page": 1,
  "pageSize": 10,
  "wfwfid": "22869",
  "sorts": {
    "value": "down___left_time"
  }
}
```

### 响应格式

```json
{
  "code": 1,
  "data": {
    "totalRecords": "25478",
    "totalPages": "500",
    "results": [
      {
        "id": "678a08b3f2091619825541ee",
        "documentType": "学士论文",
        "fields": [
          {
            "key": "题名",
            "value": "论文标题"
          }
        ]
      }
    ]
  },
  "message": "请求正确响应"
}
```

## 性能优化

1. **批量处理**: 使用 `crawlAllPages()` 而不是多次调用 `crawlPage()`
2. **合理分页**: 设置适当的 `pageSize`，推荐10-50
3. **错误重试**: 实现指数退避的重试机制
4. **内存管理**: 对于大量数据，考虑分批处理和清理

## 更新日志

- **v1.0.0** - 初始版本，支持基本的爬取和存储功能
- **v1.1.0** - 添加按年份和专业爬取功能
- **v1.2.0** - 优化错误处理和重试机制

## 支持

如有问题，请查看：

1. 项目的 Issues 页面
2. 技术文档
3. 联系开发团队
