const {
  disableConsoleLogForTest,
} = require('../../packages/neo-one-client-switch/src/common/processConsoleLogMessages');

disableConsoleLogForTest();
jest.setTimeout(30 * 1000);

afterEach(async () => {
  await one.cleanupTest();
});
