const { disableConsoleLogForTest } = require('@neo-one/client-switch');

disableConsoleLogForTest();
jest.setTimeout(30 * 1000);

afterEach(async () => {
  await one.cleanupTest();
});
