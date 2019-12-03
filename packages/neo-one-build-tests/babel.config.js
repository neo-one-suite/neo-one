const r = require.resolve;

module.exports = {
  presets: [
    [
      r('@babel/preset-env'),
      {
        targets: { node: true },
      },
    ],
  ],
};
