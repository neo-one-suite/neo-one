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
  rootDir: APP_ROOT_DIR,
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
  transformIgnorePatterns: ['node_modules'],
  transform: {
    '^.+\\.tsx?$': `${jest_root}/node_modules/ts-jest`,
    '^.+\\.jsx?$': [
      `${jest_root}/node_modules/babel-jest`,
      {
        configFile: require.resolve('../babel.config.js'),
        babelrc: true,
        babelrcRoots: './packages/*',
      },
    ],
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/__tests__/**/*',
    '!packages/*/src/__other_tests__/**/*',
    '!packages/*/src/__ledger_tests__/**/*',
    '!packages/*/src/__e2e__/**/*',
    '!packages/*/src/__data__/**/*',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/packages/.*/node_modules',
    '<rootDir>/packages/neo-one-cli/.*',
    '<rootDir>/packages/neo-one-developer-tools-.*',
    '<rootDir>/packages/neo-one-editor/.*',
    '<rootDir>/packages/neo-one-editor-server/.*',
    '<rootDir>/packages/neo-one-node-browser-.*',
    '<rootDir>/packages/neo-one-smart-contract-compiler/src/scripts/generateTypes.ts',
    '<rootDir>/packages/neo-one-smart-contract-lib/.*',
    '<rootDir>/packages/neo-one-smart-contract/.*',
    '<rootDir>/packages/neo-one-smart-contract-test-browser/.*',
    '<rootDir>/packages/neo-one-website/.*',
    '<rootDir>/packages/neo-one-build-.*',
    '<rootDir>/packages/neo-one-local-.*',
  ],
  testEnvironment: `${jest_root}/environments/${path}/NodeEnvironment.js`,
  setupFilesAfterEnv: [`${jest_root}/environments/${path}/jestSetup.js`],
});
