describe('@neo-one/server-plugin-wallet', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server-plugin-wallet');
    expect(time).toBeLessThan(3000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-wallet');
    expect(time).toBeLessThan(1500);
  });
});
