describe('@neo-one/server-plugin', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server-plugin');
    expect(time).toBeLessThan(250);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin');
    expect(time).toBeLessThan(125);
  });
});
