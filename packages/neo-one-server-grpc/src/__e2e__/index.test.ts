describe('@neo-one/server-grpc', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/server-grpc');
    expect(time).toBeLessThan(100);
  });
});
