describe('@neo-one/node-network', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-network');
    expect(time).toBeLessThan(1200);
  });
});
