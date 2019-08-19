module.exports = (name) => ({
  reporters: [
    'default',
    ['jest-junit', { output: `reports/jest-${name}/results.xml` }],
  ],
});
