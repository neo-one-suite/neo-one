import path from 'path';

const APP_ROOT = path.resolve(__dirname, '..');
const CSHARP_APP_ROOT = process.env.EDGE_APP_ROOT ?? path.resolve(APP_ROOT, 'lib', 'bin', 'Debug', 'netcoreapp3.0');

export const constants = {
  APP_ROOT,
  CSHARP_APP_ROOT,
};
