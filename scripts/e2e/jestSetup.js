const {
  disableConsoleLogForTest,
} = require('../../packages/neo-one-client-switch/src/common/processConsoleLogMessages');
const {
  setGlobalLogLevel,
} = require('../../packages/neo-one-logger/src/loggers');

disableConsoleLogForTest();
setGlobalLogLevel('silent');
jest.setTimeout(30 * 1000);

beforeEach(async () => {
  await one.setup();
});

afterEach(async () => {
  await one.cleanupTest();
});
