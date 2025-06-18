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
    return {
      provider: 'mysql',
      url:
        process.env.DATABASE_URL ||
        'mysql://root:password@localhost:3306/topicforge_production',
      shadowUrl:
        process.env.SHADOW_DATABASE_URL ||
        'mysql://root:password@localhost:3306/topicforge_shadow',
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
 * 生产环境配置
 */
export const productionConfig: DatabaseConfig = {
  provider: 'mysql',
  url: 'mysql://root:password@localhost:3306/topicforge_production',
  shadowUrl: 'mysql://root:password@localhost:3306/topicforge_shadow',
  migrationPath: './prisma/migrations/production',
};
