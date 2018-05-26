const getBabelConfig = require('./scripts/getBabelConfig');

module.exports = getBabelConfig({
  useBuiltIns: false,
  modules: 'commonjs',
  // TODO: Figure out how to make this work for both js/ts
});
