describe('@neo-one/node-rpc', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-rpc');
    expect(time).toBeLessThan(900);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-rpc');
    expect(time).toBeLessThan(500);
  });
});
