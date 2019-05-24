/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-rpc-handler', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-rpc-handler');
    expect(time).toBeLessThan(3000);
  });
});
