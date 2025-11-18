module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'prettier', // Must be last to override other configs
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // Production code rules
    'no-console': 'off', // Allow console in Node.js backend
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-process-exit': 'off', // Allow process.exit() in startup files

    // Node.js specific
    'node/no-unpublished-require': 'off', // Allow dev dependencies in tests
    'node/no-missing-require': 'error',
    'node/no-extraneous-require': 'error',

    // Code quality
    'prefer-const': 'warn',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],

    // Best practices
    'no-throw-literal': 'error',
    'prefer-promise-reject-errors': 'error',
  },
  overrides: [
    {
      // Test files - more lenient rules
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
        'node/no-unpublished-require': 'off',
      },
    },
  ],
};
