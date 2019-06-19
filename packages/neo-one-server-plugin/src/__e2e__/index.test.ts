describe('@neo-one/server-plugin', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin');
    expect(time).toBeLessThan(500);
  });
});
