describe('@neo-one/monitor', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/monitor');
    expect(time).toBeLessThan(400);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/monitor');
    expect(time).toBeLessThan(200);
  });
});
