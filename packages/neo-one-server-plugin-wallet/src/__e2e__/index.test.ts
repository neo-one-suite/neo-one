/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/server-plugin-wallet', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-wallet');
    expect(time).toBeLessThan(9000);
  });
});
