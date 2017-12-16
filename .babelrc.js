const getBabelConfig = require('./scripts/getBabelConfig');

module.exports = getBabelConfig({
  useBuiltIns: false,
  modules: 'commonjs',
});
