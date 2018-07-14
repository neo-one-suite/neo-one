const base = require('./base');

module.exports = {
  ...base({
    babel: {
      plugins: ['babel-plugin-jest-hoist'],
    },
  }),
  displayName: 'unit',
  testRegex: '^.*/__tests__/.*\\.test\\.tsx?$',
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: './scripts/test/jestSetup.js',
  moduleNameMapper: {
    '^@reactivex/ix-esnext-esm(.*)': '@reactivex/ix-esnext-cjs$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/.*'],
};
