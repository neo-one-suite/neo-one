describe('@neo-one/node', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node');
    expect(time).toBeLessThan(1800);
  });
});
