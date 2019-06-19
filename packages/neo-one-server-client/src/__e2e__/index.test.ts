describe('@neo-one/server-client', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-client');
    expect(time).toBeLessThan(1500);
  });
});
