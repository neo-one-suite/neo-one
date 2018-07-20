describe('@neo-one/node-storage-cache', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-storage-cache');
    expect(time).toBeLessThan(1100);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-storage-cache');
    expect(time).toBeLessThan(400);
  });
});
