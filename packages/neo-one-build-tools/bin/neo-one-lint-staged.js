#!/usr/bin/env node
const path = require('path');
const lintStaged = require('lint-staged');

require('ts-node').register({
  transpileOnly: true,
  project: path.resolve(__dirname, '..', 'tsconfig.json'),
});

lintStaged({
  relative: true,
}).catch((error) => {
  process.stderr.write(`${error.message}`);
});
