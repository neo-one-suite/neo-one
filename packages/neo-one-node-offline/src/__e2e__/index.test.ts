describe('@neo-one/node-offline', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-offline');
    expect(time).toBeLessThan(2000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-offline');
    expect(time).toBeLessThan(800);
  });
});
