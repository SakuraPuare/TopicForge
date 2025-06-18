/**
 * 数据库配置
 * 支持开发环境(SQLite)和生产环境(MySQL)
 */

export interface DatabaseConfig {
  provider: 'sqlite' | 'mysql';
  url: string;
  shadowUrl?: string;
  migrationPath: string;
}

/**
 * 获取当前环境的数据库配置
 */
export function getDatabaseConfig(): DatabaseConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    // 生产环境必须使用环境变量配置
    const databaseUrl = process.env.DATABASE_URL;
    const shadowUrl = process.env.SHADOW_DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        '生产环境必须设置 DATABASE_URL 环境变量。' +
          '格式: mysql://username:password@host:port/database'
      );
    }

    return {
      provider: 'mysql',
      url: databaseUrl,
      shadowUrl: shadowUrl,
      migrationPath: './prisma/migrations/production',
    };
  }

  // 开发环境默认使用 SQLite
  return {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./dev.db',
    migrationPath: './prisma/migrations/development',
  };
}

/**
 * 开发环境配置
 */
export const developmentConfig: DatabaseConfig = {
  provider: 'sqlite',
  url: 'file:./dev.db',
  migrationPath: './prisma/migrations/development',
};

/**
 * 生产环境配置示例（实际应使用环境变量）
 */
export const productionConfig: DatabaseConfig = {
  provider: 'mysql',
  url:
    process.env.DATABASE_URL || 'mysql://username:password@host:port/database',
  shadowUrl:
    process.env.SHADOW_DATABASE_URL ||
    'mysql://username:password@host:port/shadow_database',
  migrationPath: './prisma/migrations/production',
};
