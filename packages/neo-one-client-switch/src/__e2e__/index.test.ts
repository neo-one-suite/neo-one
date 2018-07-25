describe('@neo-one/client-switch', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-switch');
    expect(time).toBeLessThan(100);
  });
});
