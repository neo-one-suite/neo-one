module.exports = ({ babel }) => ({
  rootDir: '../',
  globals: {
    'ts-jest': {
      skipBabel: babel === undefined,
      babel,
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
});
