describe('@neo-one/node-data-backup', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-data-backup');
    expect(time).toBeLessThan(320);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-data-backup');
    expect(time).toBeLessThan(140);
  });
});
