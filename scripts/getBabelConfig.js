module.exports = ({ modules, useBuiltIns, targets }) => ({
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: useBuiltIns == undefined ? false : useBuiltIns,
        modules,
        targets: targets == undefined ? { node: '10.5.0' } : targets,
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-async-generator-functions',
    '@babel/plugin-proposal-class-properties',
    targets == undefined || (typeof targets === 'object' && targets.node != undefined)
      ? undefined
      : ['@babel/plugin-proposal-object-rest-spread'],
    '@babel/plugin-proposal-optional-catch-binding',
  ].filter(Boolean),
});

module.exports.default = module.exports;
