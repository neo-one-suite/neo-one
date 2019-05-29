/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-protocol', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-protocol');
    expect(time).toBeLessThan(2700);
  });
});
