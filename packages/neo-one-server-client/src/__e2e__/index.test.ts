describe('@neo-one/server-client', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server-client');
    expect(time).toBeLessThan(450);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-client');
    expect(time).toBeLessThan(250);
  });
});
