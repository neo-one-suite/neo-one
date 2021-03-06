const base = require('./base');

module.exports = {
  ...base({ path: 'e2e' }),
  displayName: 'e2e',
  testRunner:
    '<rootDir>/packages/neo-one-build-tests/node_modules/jest-circus/runner',
  testRegex: '^.*/__e2e__/.*\\.test\\.tsx?$',
  moduleNameMapper: {
    '^@neo-one/cli$': '<rootDir>/packages/neo-one-cli/src/index',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/packages/[a-z-]+/package.json',
    '<rootDir>/common',
  ],
};
