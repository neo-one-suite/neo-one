describe('@neo-one/node-neo-settings', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-neo-settings');
    expect(time).toBeLessThan(500);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-neo-settings');
    expect(time).toBeLessThan(200);
  });
});
