describe('@neo-one/cli', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/cli');
    expect(time).toBeLessThan(1500);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/cli');
    expect(time).toBeLessThan(1000);
  });
});
