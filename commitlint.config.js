/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // 支持可选的 emoji 前缀，格式: [emoji] type(scope): subject
      headerPattern:
        /^(?:\s*([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])\s*)?(\w*)(?:\((.*)\))?:\s*(.*)$/u,
      headerCorrespondence: ['emoji', 'type', 'scope', 'subject'],
    },
  },
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // Bug 修复
        'docs', // 文档更新
        'style', // 代码格式 (不影响功能)
        'refactor', // 重构 (既不是新功能也不是修复)
        'perf', // 性能优化
        'test', // 测试相关
        'build', // 构建系统或外部依赖
        'ci', // CI 配置
        'chore', // 其他杂项
        'revert', // 回滚提交
      ],
    ],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 主题不限制大小写 (支持中文)
    'subject-case': [0],
    // 主题最大长度
    'subject-max-length': [2, 'always', 100],
    // 头部最大长度
    'header-max-length': [2, 'always', 120],
    // Body 每行最大长度
    'body-max-line-length': [2, 'always', 200],
    // Footer 每行最大长度
    'footer-max-line-length': [2, 'always', 200],
  },
  // 忽略某些提交 (如合并提交)
  ignores: [commit => commit.includes('Merge')],
};
