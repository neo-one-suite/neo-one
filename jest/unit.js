const base = require('./base');

module.exports = {
  ...base({
    babel: {
      plugins: ['babel-plugin-jest-hoist'],
    },
    path: 'test',
  }),
  displayName: 'unit',
  testRegex: '^.*/__tests__/.*\\.test\\.tsx?$',
  moduleNameMapper: {
    '^@reactivex/ix-esnext-esm(.*)': '@reactivex/ix-esnext-cjs$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/.*'],
  coverageReporters: ['json'],
};
