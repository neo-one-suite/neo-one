const nodePath = require('path');

let testPathIgnorePatterns = ['/node_modules/', '/courses/'];

if (process.platform === 'win32') {
  testPathIgnorePatterns = testPathIgnorePatterns.concat([
    '/packages/neo-one-editor/src/__tests__/.*',
    '/packages/neo-one-editor-server/src/__tests__/.*',
    '/packages/neo-one-smart-contract-compiler/src/__tests__/getSemanticDiagnostics.test.ts',
  ]);
}

module.exports = ({ path }) => ({
  testRunner: 'jest-circus/runner',
  rootDir: nodePath.resolve(__dirname, '..'),
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig/tsconfig.es2017.cjs.json',
      isolatedModules: true,
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node', 'ts', 'tsx'],
  snapshotSerializers: [
    './scripts/serializers/blockchain.js',
    './scripts/serializers/bn.js',
    './scripts/serializers/buffer.js',
  ],
  testPathIgnorePatterns,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  testEnvironment: `./scripts/${path}/NodeEnvironment.js`,
  setupFilesAfterEnv: [`<rootDir>/scripts/${path}/jestSetup.js`],
});
