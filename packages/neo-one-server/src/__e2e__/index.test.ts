/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/server', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server');
    expect(time).toBeLessThan(3600);
  });
});
