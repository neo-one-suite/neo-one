describe('@neo-one/monitor', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/monitor');
    expect(time).toBeLessThan(400);
  });
});
