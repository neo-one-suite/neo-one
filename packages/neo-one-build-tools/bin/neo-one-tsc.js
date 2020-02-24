#!/usr/bin/env node
const path = require('path');
const execa = require('execa');

execa(
  path.resolve(__dirname, '..', 'node_modules', '.bin', 'tsc'),
  ['--project', '.', '--noEmit'],
  {
    stdio: 'inherit',
  },
);
