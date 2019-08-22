const {
  disableConsoleLogForTest,
} = require('../../dist/neo-one/packages/neo-one-client-switch/common/processConsoleLogMessages');
const {
  setGlobalLogLevel,
} = require('../../dist/neo-one/packages/neo-one-logger/loggers');

disableConsoleLogForTest();
setGlobalLogLevel('silent');
jest.setTimeout(30 * 1000);
jest.retryTimes(2);

beforeEach(async () => {
  await one.setup();
});

afterEach(async () => {
  await one.cleanupTest();
});
