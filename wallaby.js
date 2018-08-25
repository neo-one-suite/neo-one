module.exports = function(wallaby) {
  return {
    files: [
      { pattern: 'jest/**/*', instrument: false },
      { pattern: 'scripts/serializers/**/*.js', instrument: false },
      { pattern: 'scripts/test/jestSetup.js', instrument: false },
      { pattern: 'package.json', instrument: false },
      { pattern: 'packages/*/package.json', instrument: false },
      { pattern: 'tsconfig.json', instrument: false },
      { pattern: 'packages/*/tsconfig.json', instrument: false },
      'packages/*/src/**/*.ts?(x)',
      'packages/*/src/**/*.snap',
      '!packages/neo-one-server/src/**/*.ts?(x)',
      '!packages/neo-one-server-client/src/**/*.ts?(x)',
      '!packages/neo-one-server-plugin/src/**/*.ts?(x)',
      '!packages/neo-one-server-plugin-*/src/**/*.ts?(x)',
      '!packages/neo-one-cli/src/**/*.ts?(x)',
      '!packages/*/src/**/*.test.ts?(x)',
      '!packages/*/src/__e2e__/**/*',
    ],
    tests: ['packages/*/src/**/__tests__/**/*.test.ts?(x)'],
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({
        ...require('./tsconfig.json').compilerOptions,
        ...require('./tsconfig/tsconfig.build.json').compilerOptions,
        ...require('./tsconfig/tsconfig.cjs.json').compilerOptions,
        ...require('./tsconfig/tsconfig.es2018.cjs.json').compilerOptions,
        ...require('./tsconfig.jest.json').compilerOptions,
      }),
    },
    preprocessors: {
      '**/*.test.js?(x)': (file) =>
        require('@babel/core').transform(file.content, {
          sourceMap: true,
          filename: file.path,
          plugins: ['babel-plugin-jest-hoist'],
        }),
    },
    setup: function(wallaby) {
      var jestConfig = require('./jest/unit.js');
      jestConfig.moduleNameMapper = {
        '^@neo-one/ec-key': '@neo-one/ec-key',
        '^@neo-one/boa': '@neo-one/boa',
        '^@neo-one/csharp': '@neo-one/csharp',
        '^@neo-one/(.+)': wallaby.projectCacheDir + '/packages/neo-one-$1/src',
      };
      jestConfig.transform = {};
      delete jestConfig.rootDir;
      wallaby.testFramework.configure(jestConfig);
    },
    hints: {
      testFileSelection: {
        include: /wallaby\.only/,
        exclude: /wallaby\.skip/,
      },
      ignoreCoverage: /istanbul ignore next/,
    },
  };
};
