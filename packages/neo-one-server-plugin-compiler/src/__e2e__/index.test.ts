describe('@neo-one/server-plugin-compiler', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-compiler');
    expect(time).toBeLessThan(3000);
  });
});
