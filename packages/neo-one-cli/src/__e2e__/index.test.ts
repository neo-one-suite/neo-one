describe('@neo-one/cli', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/cli');
    expect(time).toBeLessThan(3000);
  });
});
