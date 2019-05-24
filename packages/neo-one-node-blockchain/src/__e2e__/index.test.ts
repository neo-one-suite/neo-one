/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-blockchain', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-blockchain');
    expect(time).toBeLessThan(1800);
  });
});
