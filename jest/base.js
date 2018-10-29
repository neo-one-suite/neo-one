const nodePath = require('path');

module.exports = ({ path }) => ({
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
  testPathIgnorePatterns: ['/node_modules/', '/courses/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: `./scripts/${path}/NodeEnvironment.js`,
  setupTestFrameworkScriptFile: `./scripts/${path}/jestSetup.js`,
});
