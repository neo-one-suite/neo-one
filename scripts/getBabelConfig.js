module.exports = ({ modules, useBuiltIns, targets, typescript }) => ({
  presets: [
    typescript ? '@babel/preset-typescript' : null,
    [
      '@babel/preset-env',
      {
        useBuiltIns: useBuiltIns == null ? false : useBuiltIns,
        modules,
        targets: targets == null ? { node: '8.9.0' } : targets,
      },
    ],
  ].filter(Boolean),
  plugins: [
    '@babel/plugin-proposal-async-generator-functions',
    typescript
      ? null
      : [
          '@babel/plugin-transform-flow-strip-types',
          { requireDirective: true },
        ],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-export-namespace-from',
  ].filter(Boolean),
});

module.exports.default = module.exports;
