# TopicForge API 文档

> 版本: 1.0.0 | 更新日期: 2025-12-02

## 概述

TopicForge 提供 RESTful API 接口，用于选题生成和选题库查询。

**基础 URL**: `http://localhost:3000/api` (开发环境)

---

## 目录

1. [认证](#认证)
2. [通用响应格式](#通用响应格式)
3. [错误处理](#错误处理)
4. [API 端点](#api-端点)
   - [POST /api/generate](#post-apigenerate)
   - [GET /api/topics](#get-apitopics)

---

## 认证

当前版本不需要认证。所有 API 端点均为公开访问。

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 失败响应

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明           |
| ------ | -------------- |
| 200    | 请求成功       |
| 400    | 请求参数错误   |
| 404    | 资源不存在     |
| 500    | 服务器内部错误 |

### 错误响应示例

```json
{
  "success": false,
  "error": "请选择有效的生成算法"
}
```

---

## API 端点

### POST /api/generate

生成毕业设计选题。

#### 请求

**URL**: `/api/generate`

**方法**: `POST`

**Content-Type**: `application/json`

**请求体**:

```json
{
  "major": "计算机科学与技术",
  "year": "2024",
  "algorithm": "markov",
  "count": 5
}
```

#### 请求参数

| 参数      | 类型   | 必需 | 默认值 | 说明                                     |
| --------- | ------ | ---- | ------ | ---------------------------------------- |
| major     | string | 否   | -      | 专业名称，不提供则使用全局模型           |
| year      | string | 否   | -      | 参考年份                                 |
| algorithm | string | 是   | -      | 生成算法: `markov`, `template`, `hybrid` |
| count     | number | 是   | -      | 生成数量 (1-50)                          |

#### 算法说明

| 算法       | 说明                                                           |
| ---------- | -------------------------------------------------------------- |
| `markov`   | 基于马尔科夫链的文本生成，根据训练数据的词语转移概率生成新选题 |
| `template` | 基于预定义模板和词汇库生成，结构更规范                         |
| `hybrid`   | 混合模式，50% 马尔科夫 + 50% 模板，结合两者优点                |

#### 响应

**成功响应 (200)**:

```json
{
  "success": true,
  "sessionId": "clxxx123abc",
  "message": "生成成功"
}
```

| 字段      | 类型    | 说明                          |
| --------- | ------- | ----------------------------- |
| success   | boolean | 操作是否成功                  |
| sessionId | string  | 生成会话 ID，用于获取生成结果 |
| message   | string  | 操作消息                      |

**失败响应 (400)**:

```json
{
  "success": false,
  "error": "请选择有效的生成算法"
}
```

**失败响应 (500)**:

```json
{
  "success": false,
  "error": "生成失败：未能生成任何有效题目，请尝试调整参数或重试"
}
```

#### 示例

**cURL**:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "major": "计算机科学与技术",
    "algorithm": "markov",
    "count": 5
  }'
```

**JavaScript (fetch)**:

```javascript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    major: '计算机科学与技术',
    algorithm: 'markov',
    count: 5,
  }),
});

const result = await response.json();

if (result.success) {
  // 跳转到结果页面
  window.location.href = `/generate/result/${result.sessionId}`;
} else {
  console.error(result.error);
}
```

---

### GET /api/topics

搜索和浏览选题库。

#### 请求

**URL**: `/api/topics`

**方法**: `GET`

**查询参数**:

```
/api/topics?search=机器学习&major=计算机科学与技术&year=2024&page=1&pageSize=10
```

#### 查询参数

| 参数     | 类型   | 必需 | 默认值 | 说明                      |
| -------- | ------ | ---- | ------ | ------------------------- |
| search   | string | 否   | -      | 搜索关键词 (模糊匹配标题) |
| major    | string | 否   | -      | 专业筛选                  |
| year     | number | 否   | -      | 年份筛选                  |
| page     | number | 否   | 1      | 页码                      |
| pageSize | number | 否   | 10     | 每页数量 (1-50)           |

#### 响应

**成功响应 (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx123abc",
      "title": "基于机器学习的图像识别系统设计与实现",
      "school": "清华大学",
      "major": "计算机科学与技术",
      "year": 2024,
      "keywords": "[\"机器学习\", \"图像识别\", \"深度学习\"]",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "clxxx456def",
      "title": "基于深度学习的自然语言处理研究",
      "school": "北京大学",
      "major": "计算机科学与技术",
      "year": 2024,
      "keywords": "[\"深度学习\", \"自然语言处理\", \"NLP\"]",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
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

#### 响应字段

**data 数组元素**:

| 字段      | 类型           | 说明                           |
| --------- | -------------- | ------------------------------ |
| id        | string         | 选题唯一标识                   |
| title     | string         | 选题标题                       |
| school    | string \| null | 学校名称                       |
| major     | string \| null | 专业名称                       |
| year      | number \| null | 年份                           |
| keywords  | string \| null | 关键词 (JSON 格式的字符串数组) |
| createdAt | string         | 创建时间 (ISO 8601)            |
| updatedAt | string         | 更新时间 (ISO 8601)            |

**pagination 对象**:

| 字段       | 类型   | 说明     |
| ---------- | ------ | -------- |
| page       | number | 当前页码 |
| pageSize   | number | 每页数量 |
| total      | number | 总记录数 |
| totalPages | number | 总页数   |

**失败响应 (400)**:

```json
{
  "success": false,
  "error": "查询参数验证失败"
}
```

**失败响应 (500)**:

```json
{
  "success": false,
  "error": "搜索选题时发生错误，请稍后重试"
}
```

#### 示例

**cURL**:

```bash
# 基本查询
curl "http://localhost:3000/api/topics?page=1&pageSize=10"

# 带搜索
curl "http://localhost:3000/api/topics?search=机器学习&page=1&pageSize=10"

# 带筛选
curl "http://localhost:3000/api/topics?major=计算机科学与技术&year=2024&page=1&pageSize=10"
```

**JavaScript (fetch)**:

```javascript
// 构建查询参数
const params = new URLSearchParams({
  search: '机器学习',
  major: '计算机科学与技术',
  page: '1',
  pageSize: '10',
});

const response = await fetch(`/api/topics?${params}`);
const result = await response.json();

if (result.success) {
  console.log(`总共 ${result.pagination.total} 条结果`);
  result.data.forEach(topic => {
    console.log(topic.title);
  });
} else {
  console.error(result.error);
}
```

---

## CORS 支持

所有 API 端点都支持 CORS (跨域资源共享)。

**允许的方法**: GET, POST, OPTIONS

**允许的头部**: Content-Type

**预检请求**: 支持 OPTIONS 方法

---

## 速率限制

当前版本没有速率限制。在生产环境中，建议配置适当的速率限制以防止滥用。

---

## 版本历史

### v1.0.0 (2025-12-02)

- 初始版本发布
- 支持选题生成 API
- 支持选题搜索 API
- 支持三种生成算法
- 支持分页和筛选

---

## 联系方式

如有问题或建议，请提交 [GitHub Issue](https://github.com/your-org/topicforge/issues)。
