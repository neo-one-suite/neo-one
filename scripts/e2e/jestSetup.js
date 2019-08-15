const {
  disableConsoleLogForTest,
} = require('../../packages/neo-one-client-switch/src/common/processConsoleLogMessages');
const {
  silenceForTests,
} = require('../../packages/neo-one-logger/src/loggers');

silenceForTests();
disableConsoleLogForTest();
jest.setTimeout(360 * 1000);

afterEach(async () => {
  await one.cleanupTest();
});
