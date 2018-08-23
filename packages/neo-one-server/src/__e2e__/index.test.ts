describe('@neo-one/server', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server');
    expect(time).toBeLessThan(1050);
  });
});
