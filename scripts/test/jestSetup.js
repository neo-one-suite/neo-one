const { disableConsoleLogForTest } = require('@neo-one/client-switch');
const { silenceForTests } = require('@neo-one/logger');

silenceForTests();
disableConsoleLogForTest();
jest.setTimeout(30 * 1000);

afterEach(async () => {
  await one.cleanupTest();
});
