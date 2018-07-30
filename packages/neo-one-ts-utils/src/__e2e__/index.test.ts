describe('@neo-one/ts-utils', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/ts-utils');
    expect(time).toBeLessThan(2500);
  });
});
