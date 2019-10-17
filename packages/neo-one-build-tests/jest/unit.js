const base = require('./base');

module.exports = {
  ...base({ path: 'test' }),
  displayName: 'unit',
  testRegex: '^.*/__tests__/.*\\.test\\.tsx?$',
  coverageReporters: ['json'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/__tests__/*.ts',
    '!packages/*/src/__e2e__/*.ts',
    '!packages/*/src/__data__/*.ts',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/common',
    '<rootDir>/packages/.*/node_modules',
    '<rootDir>/packages/.*/src/__data__/contracts/.*',
    '<rootDir>/packages/.*/src/__data__/snippets/.*',
    '<rootDir>/packages/neo-one-smart-contract-compiler/src/scripts/generateTypes.ts',
    '<rootDir>/packages/neo-one-smart-contract-lib/src/.*',
    '<rootDir>/packages/neo-one-smart-contract/src/.*',
    '<rootDir>/packages/.*/src/__ledger_tests__/.*',
  ],
};
