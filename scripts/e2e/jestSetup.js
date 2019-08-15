const {
  disableConsoleLogForTest,
} = require('../../packages/neo-one-client-switch/src/common/processConsoleLogMessages');

disableConsoleLogForTest();
jest.setTimeout(360 * 1000);
jest.retryTimes(3);

afterEach(async () => {
  await one.cleanupTest();
  await one.configurePorts();
});
