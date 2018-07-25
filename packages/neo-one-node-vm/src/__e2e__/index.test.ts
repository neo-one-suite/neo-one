describe('@neo-one/node-vm', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-vm');
    expect(time).toBeLessThan(1000);
  });
});
