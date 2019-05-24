/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/cli', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/cli');
    expect(time).toBeLessThan(6000);
  });
});
