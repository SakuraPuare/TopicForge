/**
 * Result 类型 - 用于统一的错误处理
 * 替代 try-catch，强制调用者处理错误情况
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  /**
   * 创建成功结果
   */
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },

  /**
   * 创建失败结果
   */
  fail<E>(error: E): Result<never, E> {
    return { success: false, error };
  },

  /**
   * 检查是否为成功结果
   */
  isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success;
  },

  /**
   * 检查是否为失败结果
   */
  isFail<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return !result.success;
  },

  /**
   * 从 Promise 创建 Result
   */
  async fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>> {
    try {
      const data = await promise;
      return Result.ok(data);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  },

  /**
   * 映射成功值
   */
  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return result;
  },

  /**
   * 映射错误值
   */
  mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (!result.success) {
      return Result.fail(fn(result.error));
    }
    return result;
  },

  /**
   * 链式操作
   */
  async flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Promise<Result<U, E>>
  ): Promise<Result<U, E>> {
    if (result.success) {
      return fn(result.data);
    }
    return result;
  },

  /**
   * 获取值或默认值
   */
  getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.success ? result.data : defaultValue;
  },

  /**
   * 获取值或抛出错误
   */
  getOrThrow<T, E>(result: Result<T, E>): T {
    if (result.success) {
      return result.data;
    }
    throw result.error;
  },
};
