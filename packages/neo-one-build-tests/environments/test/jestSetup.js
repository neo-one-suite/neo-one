const { setGlobalLogLevel } = require('@neo-one/logger');
const appRootDir = require('app-root-dir');
const path = require('path');

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
appRootDir.set(APP_ROOT_DIR);

setGlobalLogLevel('silent');
jest.setTimeout(120 * 1000);

const tempConsole = global.console;
global.console = {
  log: jest.fn(),
  error: console.error,
  warn: console.warn,
  info: jest.fn(),
  debug: jest.fn(),
};

afterEach(async () => {
  await one.cleanupTest();
});

afterAll(() => {
  global.console = tempConsole;
});
