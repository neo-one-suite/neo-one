const nodePath = require('path');
const appRootDir = require('app-root-dir');

const APP_ROOT_DIR = process.cwd();
appRootDir.set(APP_ROOT_DIR);

let testPathIgnorePatterns = ['/node_modules/', '/courses/'];

const jest_root = nodePath.resolve(__dirname, '..');

if (process.platform === 'win32') {
  testPathIgnorePatterns = testPathIgnorePatterns.concat([
    '/packages/neo-one-editor/src/__tests__/.*',
    '/packages/neo-one-editor-server/src/__tests__/.*',
    '/packages/neo-one-smart-contract-compiler/src/__tests__/getSemanticDiagnostics.test.ts',
  ]);
}

module.exports = ({ path }) => ({
  rootDir: process.cwd(),
  modulePathIgnorePatterns: ['<rootDir>/common/'],
  globals: {
    'ts-jest': {
      tsConfig: `${jest_root}/tsconfig.jest.json`,
      isolatedModules: true,
    },
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node', 'ts', 'tsx'],
  snapshotSerializers: [
    `${jest_root}/serializers/blockchain.js`,
    `${jest_root}/serializers/bn.js`,
    `${jest_root}/serializers/buffer.js`,
  ],
  testPathIgnorePatterns,
  transform: {
    '^.+\\.tsx?$': `${jest_root}/node_modules/ts-jest`,
    '^.+\\.jsx?$': `${jest_root}/node_modules/babel-jest`,
  },
  testEnvironment: `${jest_root}/environments/${path}/NodeEnvironment.js`,
  setupFilesAfterEnv: [`${jest_root}/environments/${path}/jestSetup.js`],
});
