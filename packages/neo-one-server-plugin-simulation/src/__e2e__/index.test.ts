describe('@neo-one/server-plugin-simulation', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server-plugin-simulation');
    expect(time).toBeLessThan(6000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-plugin-simulation');
    expect(time).toBeLessThan(3000);
  });
});
