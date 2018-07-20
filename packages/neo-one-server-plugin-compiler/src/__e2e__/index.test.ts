describe('@neo-one/server-plugin-compiler', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server-plugin-compiler');
    expect(time).toBeLessThan(2000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-compiler');
    expect(time).toBeLessThan(1000);
  });
});
