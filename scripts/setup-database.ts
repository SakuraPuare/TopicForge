#!/usr/bin/env ts-node

/**
 * 数据库设置脚本
 * 支持切换开发环境(SQLite)和生产环境(MySQL)配置
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const configs = {
  development: {
    provider: 'sqlite' as const,
    url: 'file:./dev.db',
  },
  production: {
    provider: 'mysql' as const,
    url: 'mysql://root:password@localhost:3306/topicforge_production',
    shadowUrl: 'mysql://root:password@localhost:3306/topicforge_shadow',
  },
};

/**
 * 更新 Prisma Schema 文件
 */
function updatePrismaSchema(environment: 'development' | 'production') {
  const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
  const config = configs[environment];

  if (!existsSync(schemaPath)) {
    console.error('❌ Prisma schema 文件不存在');
    process.exit(1);
  }

  let schema = readFileSync(schemaPath, 'utf-8');

  // 更新 datasource 配置
  const datasourceRegex = /datasource db \{[\s\S]*?\}/;
  let newDatasource = `datasource db {
  provider = "${config.provider}"
  url      = env("DATABASE_URL")`;

  if ('shadowUrl' in config && config.shadowUrl) {
    newDatasource += `
  shadowUrl = env("SHADOW_DATABASE_URL")`;
  }

  newDatasource += '\n}';

  schema = schema.replace(datasourceRegex, newDatasource);

  // 如果是 MySQL，添加数据库特定的属性
  if (config.provider === 'mysql') {
    // 替换字符串字段类型
    schema = schema.replace(
      /String(\s+@unique)?(\s+@db\.VarChar\(\d+\))?/g,
      (match, unique, existing) => {
        if (existing) return match; // 已经有 @db.VarChar 注解
        if (unique) return `String${unique} @db.VarChar(255)`;
        return 'String @db.VarChar(255)';
      }
    );

    // 为长文本字段使用 Text 类型
    schema = schema.replace(
      /String\?\s*\/\/ JSON格式存储关键词数组/g,
      'Text? // JSON格式存储关键词数组'
    );
    schema = schema.replace(
      /String\s*\/\/ 生成的题目数组 \(JSON字符串\)/g,
      'Text // 生成的题目数组 (JSON字符串)'
    );
    schema = schema.replace(
      /String\s*\/\/ 生成参数 \(JSON字符串\)/g,
      'Text // 生成参数 (JSON字符串)'
    );
    schema = schema.replace(
      /String\s*\/\/ 生成统计信息 \(JSON字符串\)/g,
      'Text // 生成统计信息 (JSON字符串)'
    );
  }

  writeFileSync(schemaPath, schema);
  console.log(`✅ 已更新 Prisma schema 为 ${environment} 环境配置`);
}

/**
 * 创建环境变量文件
 */
function createEnvFile(environment: 'development' | 'production') {
  const config = configs[environment];
  const envPath = join(process.cwd(), `.env.${environment}`);

  let envContent = `# ${environment.toUpperCase()} 环境配置
NODE_ENV=${environment}
DATABASE_URL="${config.url}"
`;

  if ('shadowUrl' in config && config.shadowUrl) {
    envContent += `SHADOW_DATABASE_URL="${config.shadowUrl}"\n`;
  }

  envContent += `
# Next.js 配置
NEXTAUTH_URL=${environment === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'}
NEXTAUTH_SECRET=${environment === 'production' ? 'your-production-secret-key-min-32-chars' : 'development-secret-key'}

# API 配置
API_BASE_URL=${environment === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'}

# 可选配置
DB_BACKUP_PATH=./backups
LOG_LEVEL=info
DEBUG=${environment === 'development' ? 'true' : 'false'}
`;

  writeFileSync(envPath, envContent);
  console.log(`✅ 已创建 .env.${environment} 文件`);
}

/**
 * 设置数据库
 */
function setupDatabase(environment: 'development' | 'production') {
  console.log(`🚀 设置 ${environment} 环境数据库...`);

  // 更新 schema
  updatePrismaSchema(environment);

  // 创建环境变量文件
  createEnvFile(environment);

  // 复制环境变量文件到 .env.local (用于开发环境)
  if (environment === 'development') {
    const localEnvPath = join(process.cwd(), '.env.local');
    const devEnvPath = join(process.cwd(), '.env.development');

    if (existsSync(devEnvPath)) {
      copyFileSync(devEnvPath, localEnvPath);
      console.log('✅ 已复制开发环境配置到 .env.local');
    }
  }

  console.log(`\n📋 下一步操作:`);
  console.log(`1. 确认 .env.${environment} 中的数据库连接信息`);

  if (environment === 'production') {
    console.log(`2. 确保 MySQL 服务器正在运行`);
    console.log(`3. 创建数据库: CREATE DATABASE topicforge_production;`);
    console.log(`4. 创建影子数据库: CREATE DATABASE topicforge_shadow;`);
    console.log(`5. 运行: npx prisma migrate deploy`);
  } else {
    console.log(`2. 运行: npx prisma generate`);
    console.log(`3. 运行: npx prisma db push`);
  }

  console.log(`\n✨ ${environment} 环境数据库配置完成!`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const environment = args[0] as 'development' | 'production';

  if (!environment || !['development', 'production'].includes(environment)) {
    console.log('使用方法:');
    console.log('  npm run setup:db development  # 设置开发环境 (SQLite)');
    console.log('  npm run setup:db production   # 设置生产环境 (MySQL)');
    process.exit(1);
  }

  setupDatabase(environment);
}

if (require.main === module) {
  main();
}
