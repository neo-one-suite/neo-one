const r = require.resolve;

module.exports = {
  presets: [
    [
      r('@babel/preset-env'),
      {
        modules: 'commonjs',
        useBuiltIns: 'entry',
        corejs: '2.6.5',
        targets: { node: true },
      },
    ],
  ],
};
