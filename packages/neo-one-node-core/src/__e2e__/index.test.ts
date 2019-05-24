/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-core', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-core');
    expect(time).toBeLessThan(2000);
  });
});
