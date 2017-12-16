module.exports = ({ modules, useBuiltIns }) => ({
  presets: [
    [
      '@babel/env',
      {
        useBuiltIns: useBuiltIns == null ? false : useBuiltIns,
        modules,
      },
    ],
  ],
  plugins: [
    '@babel/proposal-async-generator-functions',
    '@babel/transform-flow-strip-types',
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
  ].filter(Boolean),
});

module.exports.default = module.exports;
