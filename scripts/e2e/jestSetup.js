const {
  disableConsoleLogForTest,
} = require('../../packages/neo-one-client-switch/src/common/processConsoleLogMessages');

disableConsoleLogForTest();
jest.setTimeout(30 * 1000);

beforeEach(async () => {
  await one.setup();
});

afterEach(async () => {
  await one.cleanupTest();
});
