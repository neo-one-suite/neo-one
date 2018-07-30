describe('@neo-one/server-plugin-simulation', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-simulation');
    expect(time).toBeLessThan(3000);
  });
});
