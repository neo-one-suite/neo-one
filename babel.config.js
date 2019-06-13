const r = require.resolve;

module.exports = {
  presets: [
    [
      r('@babel/preset-env'),
      {
        modules: 'commonjs',
        useBuiltIns: 'usage',
        corejs: 3,
        targets: { node: true },
      },
    ],
  ],
};
