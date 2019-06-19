describe('@neo-one/node-storage-levelup', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-storage-levelup');
    expect(time).toBeLessThan(1500);
  });
});
