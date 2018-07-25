describe('@neo-one/node-blockchain', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-blockchain');
    expect(time).toBeLessThan(900);
  });
});
