#!/usr/bin/env node
const path = require('path');
require('ts-node').register({
  transpileOnly: true,
  project: path.resolve(__dirname, 'tsconfig.json'),
});
const linter = require('./src/linters/lint.ts');

linter.lint();
