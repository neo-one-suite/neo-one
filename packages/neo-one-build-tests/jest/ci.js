module.exports = (name) => ({
  reporters: [
    'default',
    [
      '<rootDir>/packages/neo-one-build-tests/node_modules/jest-junit',
      { output: `<rootDir>/reports/jest-${name}/results.xml` },
    ],
  ],
});
