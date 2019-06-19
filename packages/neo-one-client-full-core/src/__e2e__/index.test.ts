describe('@neo-one/client-full-core', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-full-core');
    expect(time).toBeLessThan(2500);
  });
});
