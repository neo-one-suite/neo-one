describe('@neo-one/server-plugin-network', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-network');
    expect(time).toBeLessThan(2600);
  });
});
