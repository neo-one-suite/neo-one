const { setGlobalLogLevel } = require('@neo-one/logger');
const path = require('path');
const appRootDir = require('app-root-dir');

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
appRootDir.set(APP_ROOT_DIR);

setGlobalLogLevel('silent');
jest.setTimeout(30 * 1000);
jest.retryTimes(2);

const tempConsole = global.console;
global.console = {
  // log: console.log, // Use this to debug source code
  log: jest.fn(),
  error: console.error,
  warn: console.warn,
  trace: console.trace,
  info: jest.fn(),
  debug: jest.fn(),
};

beforeEach(async () => {
  await one.setup();
});

afterEach(async () => {
  await one.cleanupTest();
});
afterAll(() => {
  global.console = tempConsole;
});
