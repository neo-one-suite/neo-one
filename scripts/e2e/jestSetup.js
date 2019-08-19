const {
  disableConsoleLogForTest,
} = require('../../packages/neo-one-client-switch/src/common/processConsoleLogMessages');
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
  await one.setupPorts();
});
