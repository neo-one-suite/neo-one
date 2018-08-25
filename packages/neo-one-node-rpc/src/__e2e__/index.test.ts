describe('@neo-one/node-rpc', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-rpc');
    expect(time).toBeLessThan(3000);
  });
});
