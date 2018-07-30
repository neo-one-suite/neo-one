describe('@neo-one/node-offline', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-offline');
    expect(time).toBeLessThan(800);
  });
});
