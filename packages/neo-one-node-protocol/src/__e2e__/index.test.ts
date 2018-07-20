describe('@neo-one/node-protocol', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-protocol');
    expect(time).toBeLessThan(2000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-protocol');
    expect(time).toBeLessThan(900);
  });
});
