module.exports = ({ modules, useBuiltIns, targets }) => ({
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: useBuiltIns == null ? false : useBuiltIns,
        modules,
        targets: targets == null ? { node: '8.9.0' } : targets,
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-async-generator-functions',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-optional-catch-binding',
  ],
});

module.exports.default = module.exports;
