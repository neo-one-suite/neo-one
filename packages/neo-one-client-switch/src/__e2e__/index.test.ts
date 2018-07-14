describe('@neo-one/client-switch', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/client-switch');
    expect(time).toBeLessThan(125);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/client-switch');
    expect(time).toBeLessThan(50);
  });
});
