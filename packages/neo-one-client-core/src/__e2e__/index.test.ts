describe('@neo-one/client-core', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/client-core');
    expect(time).toBeLessThan(1200);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-core');
    expect(time).toBeLessThan(400);
  });
});
