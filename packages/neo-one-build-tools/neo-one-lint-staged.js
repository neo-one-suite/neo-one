#!/usr/bin/env node
const lintStaged = require('lint-staged');

lintStaged({
  relative: true,
}).catch((error) => {
  process.stderr.write(`${error.message}`);
});
