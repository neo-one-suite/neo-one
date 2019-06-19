describe('@neo-one/node-storage-common', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-storage-common');
    expect(time).toBeLessThan(1500);
  });
});
