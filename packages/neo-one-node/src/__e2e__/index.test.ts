/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node');
    expect(time).toBeLessThan(3600);
  });
});
