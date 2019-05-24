/// <reference types="@neo-one/types/e2e"/>

describe('@neo-one/node-consensus', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-consensus');
    expect(time).toBeLessThan(2700);
  });
});
