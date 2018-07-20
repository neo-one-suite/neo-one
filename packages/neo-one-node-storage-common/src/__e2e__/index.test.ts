describe('@neo-one/node-storage-common', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-storage-common');
    expect(time).toBeLessThan(1200);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-storage-common');
    expect(time).toBeLessThan(500);
  });
});
