const nodePath = require('path');

module.exports = ({ babel, path }) => ({
  rootDir: nodePath.resolve(__dirname, '..'),
  globals: {
    'ts-jest': {
      skipBabel: babel === undefined,
      babelConfig: babel,
      tsConfigFile: 'tsconfig.jest.json',
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node', 'ts', 'tsx'],
  snapshotSerializers: [
    './scripts/serializers/blockchain.js',
    './scripts/serializers/bn.js',
    './scripts/serializers/buffer.js',
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: `./scripts/${path}/NodeEnvironment.js`,
  setupTestFrameworkScriptFile: `./scripts/${path}/jestSetup.js`,
});
