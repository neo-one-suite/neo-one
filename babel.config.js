const r = require.resolve;

module.exports = {
  presets: [
    [
      r('@babel/preset-env'),
      {
        modules: 'commonjs',
        useBuiltIns: 'entry',
        targets: { node: true },
      },
    ],
  ],
};
