module.exports = ({ modules, useBuiltIns, targets }) => ({
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: useBuiltIns == null ? false : useBuiltIns,
        modules,
        targets,
      },
    ],
  ],
  plugins: [
    '@babel/proposal-async-generator-functions',
    '@babel/transform-flow-strip-types',
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    '@babel/plugin-proposal-export-namespace-from',
  ].filter(Boolean),
});

module.exports.default = module.exports;
