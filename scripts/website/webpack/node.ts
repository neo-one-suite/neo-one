import webpack from 'webpack';

export const node: webpack.Node = {
  console: 'mock',
  global: true,
  process: true,
  __filename: 'mock',
  __dirname: 'mock',
  Buffer: true,
  setImmediate: true,
  fs: 'empty',
};
