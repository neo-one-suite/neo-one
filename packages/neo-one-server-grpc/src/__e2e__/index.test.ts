describe('@neo-one/server-grpc', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/server-grpc');
    expect(time).toBeLessThan(75);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-grpc');
    expect(time).toBeLessThan(10);
  });
});
