describe('@neo-one/utils-node', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/utils-node');
    expect(time).toBeLessThan(300);
  });
});
