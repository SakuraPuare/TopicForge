# 数据库配置指南

## 概述

TopicForge 支持两套数据库配置：

- **开发环境**: SQLite 文件数据库（轻量级，无需额外安装）
- **生产环境**: MySQL 数据库（高性能，支持并发）

## 快速开始

### 开发环境设置 (SQLite)

1. **自动设置开发环境**:

   ```bash
   npm run setup:db:dev
   ```

2. **初始化数据库**:

   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **启动开发服务器**:

   ```bash
   npm run dev
   ```

### 生产环境设置 (MySQL)

1. **安装并启动 MySQL**:

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server
   sudo systemctl start mysql

   # macOS
   brew install mysql
   brew services start mysql

   # Windows
   # 下载并安装 MySQL Community Server
   ```

2. **创建数据库**:

   ```sql
   CREATE DATABASE topicforge_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE topicforge_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

   -- 创建用户（可选）
   CREATE USER 'topicforge'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON topicforge_production.* TO 'topicforge'@'localhost';
   GRANT ALL PRIVILEGES ON topicforge_shadow.* TO 'topicforge'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **设置生产环境配置**:

   ```bash
   npm run setup:db:prod
   ```

4. **编辑生产环境配置**:
   编辑 `.env.production` 文件，更新数据库连接信息：

   ```env
   DATABASE_URL="mysql://topicforge:your_password@localhost:3306/topicforge_production"
   SHADOW_DATABASE_URL="mysql://topicforge:your_password@localhost:3306/topicforge_shadow"
   ```

5. **部署数据库迁移**:

   ```bash
   npm run db:deploy
   ```

## 可用脚本

### 数据库设置脚本

- `npm run setup:db:dev` - 设置开发环境 (SQLite)
- `npm run setup:db:prod` - 设置生产环境 (MySQL)

### Prisma 操作脚本

- `npm run db:generate` - 生成 Prisma 客户端
- `npm run db:push` - 推送 schema 到数据库（开发用）
- `npm run db:migrate` - 创建新迁移（开发用）
- `npm run db:deploy` - 部署迁移到生产环境
- `npm run db:studio` - 打开 Prisma Studio 数据库管理界面
- `npm run db:reset` - 重置数据库（⚠️ 谨慎使用）

## 环境配置文件

### 开发环境 (.env.development)

```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key
API_BASE_URL=http://localhost:3000
DB_BACKUP_PATH=./backups
LOG_LEVEL=info
DEBUG=true
```

### 生产环境 (.env.production)

```env
NODE_ENV=production
DATABASE_URL="mysql://username:password@localhost:3306/topicforge_production"
SHADOW_DATABASE_URL="mysql://username:password@localhost:3306/topicforge_shadow"
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key-min-32-chars
API_BASE_URL=https://your-domain.com
DB_BACKUP_PATH=./backups
LOG_LEVEL=info
DEBUG=false
```

## 环境切换

### 从开发环境切换到生产环境

```bash
# 1. 设置生产环境配置
npm run setup:db:prod

# 2. 编辑 .env.production 文件中的数据库连接信息

# 3. 设置环境变量
export NODE_ENV=production

# 4. 部署迁移
npm run db:deploy

# 5. 生成生产环境客户端
npm run db:generate
```

### 从生产环境切换回开发环境

```bash
# 1. 重新设置开发环境
npm run setup:db:dev

# 2. 重置环境变量
export NODE_ENV=development

# 3. 推送 schema
npm run db:push
```

## 数据库 Schema 差异

### SQLite (开发环境)

- 轻量级文件数据库
- 自动创建 `dev.db` 文件
- 支持基本的 SQL 功能
- 无需额外配置

### MySQL (生产环境)

- 高性能关系型数据库
- 支持并发访问
- 优化的索引和查询性能
- 增加了数据库特定的类型优化:
  - `@db.VarChar(255)` 用于字符串字段
  - `Text` 用于长文本内容
  - 适当的索引配置

## 故障排除

### 常见问题

1. **"DATABASE_URL 环境变量未定义"**

   - 确保运行了相应的设置脚本
   - 检查 `.env.local` 或相应环境的配置文件

2. **MySQL 连接失败**

   - 确保 MySQL 服务正在运行
   - 检查数据库连接字符串
   - 验证用户权限

3. **Prisma 客户端生成失败**

   - 运行 `npm run db:generate`
   - 检查 schema.prisma 文件语法

4. **迁移失败**
   - 检查数据库连接
   - 确保有足够的权限
   - 查看错误日志

### 重置数据库

```bash
# ⚠️ 警告：这将删除所有数据
npm run db:reset
```

## 最佳实践

1. **开发流程**:

   - 始终在开发环境测试 schema 变更
   - 使用 `db:push` 进行快速原型开发
   - 生产部署前创建正式迁移

2. **生产部署**:

   - 始终备份生产数据库
   - 在维护窗口期间部署迁移
   - 验证迁移结果

3. **安全性**:

   - 使用强密码
   - 限制数据库用户权限
   - 定期更新依赖项

4. **性能优化**:
   - 根据查询模式添加索引
   - 定期分析慢查询
   - 监控数据库性能指标
