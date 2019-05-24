/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/client-common', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-common');
    expect(time).toBeLessThan(2500);
  });
});
