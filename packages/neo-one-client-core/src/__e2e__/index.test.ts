describe('@neo-one/client-core', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-core');
    expect(time).toBeLessThan(600);
  });
});
