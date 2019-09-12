const {
  disableConsoleLogForTest,
} = require('../../../../neo-one-client-switch/lib/common/processConsoleLogMessages');
const { setGlobalLogLevel } = require('../../../../neo-one-logger/lib/loggers');

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
