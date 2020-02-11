module.exports = () => ({
  autoDetect: true,
  testFramework: {
    path: './common/temp/node_modules',
    configFile: './packages/neo-one-build-tests/jest/unit',
  },
});
