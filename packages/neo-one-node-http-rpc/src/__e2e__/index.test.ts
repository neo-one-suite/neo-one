/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-http-rpc', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-http-rpc');
    expect(time).toBeLessThan(3000);
  });
});
