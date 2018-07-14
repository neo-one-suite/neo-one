describe('@neo-one/node', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node');
    expect(time).toBeLessThan(1500);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node');
    expect(time).toBeLessThan(600);
  });
});
