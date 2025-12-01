/**
 * 领域错误类型定义
 * 提供统一的错误处理机制
 */

/**
 * 基础领域错误
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * 验证错误 - 输入数据不符合要求
 */
export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 未找到错误 - 请求的资源不存在
 */
export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    const message = id
      ? `${entity} with id "${id}" not found`
      : `${entity} not found`;
    super(message, 'NOT_FOUND', { entity, id });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 数据不足错误 - 数据量不足以完成操作
 */
export class InsufficientDataError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INSUFFICIENT_DATA', details);
    this.name = 'InsufficientDataError';
    Object.setPrototypeOf(this, InsufficientDataError.prototype);
  }
}

/**
 * 生成错误 - 题目生成过程中的错误
 */
export class GenerationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'GENERATION_ERROR', details);
    this.name = 'GenerationError';
    Object.setPrototypeOf(this, GenerationError.prototype);
  }
}

/**
 * 数据库错误 - 数据库操作失败
 */
export class DatabaseError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * 配置错误 - 系统配置不正确
 */
export class ConfigurationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * 训练错误 - 模型训练过程中的错误
 */
export class TrainingError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TRAINING_ERROR', details);
    this.name = 'TrainingError';
    Object.setPrototypeOf(this, TrainingError.prototype);
  }
}

/**
 * 检查是否为领域错误
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * 将未知错误转换为领域错误
 */
export function toDomainError(error: unknown): DomainError {
  if (isDomainError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new DomainError(error.message, 'UNKNOWN_ERROR', {
      originalName: error.name,
      stack: error.stack,
    });
  }

  return new DomainError(String(error), 'UNKNOWN_ERROR');
}
