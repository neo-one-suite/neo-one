describe('@neo-one/server', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server');
    expect(time).toBeLessThan(1300);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server');
    expect(time).toBeLessThan(700);
  });
});
