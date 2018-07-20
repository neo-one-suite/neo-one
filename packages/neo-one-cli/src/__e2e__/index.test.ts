describe('@neo-one/cli', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/cli');
    expect(time).toBeLessThan(3000);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/cli');
    expect(time).toBeLessThan(2000);
  });
});
