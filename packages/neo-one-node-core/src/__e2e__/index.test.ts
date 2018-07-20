describe('@neo-one/node-core', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-core');
    expect(time).toBeLessThan(2000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-core');
    expect(time).toBeLessThan(1000);
  });
});
