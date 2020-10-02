const base = require('./base');

module.exports = {
  ...base({ path: 'test' }),
  displayName: 'unit',
  moduleNameMapper: {
    '^@neo-one/ec-key$': '@neo-one/ec-key',
    '^@neo-one/edge$': '@neo-one/edge',
    '^@neo-one/boa$': '@neo-one/boa',
    '^@neo-one/csharp$': '@neo-one/csharp',
    '^@neo-one/smart-contract$':
      '<rootDir>/packages/neo-one-smart-contract/src/index.d.ts',
    '^@neo-one/(.*)$': '<rootDir>/packages/neo-one-$1/src/index',
  },
  testRegex: '^.*/__tests__/.*\\.test\\.tsx?$',
  coverageReporters: ['json'],
};
