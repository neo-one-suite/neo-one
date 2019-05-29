/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-storage-cache', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-storage-cache');
    expect(time).toBeLessThan(1200);
  });
});
