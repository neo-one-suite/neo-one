describe('@neo-one/smart-contract-compiler', () => {
  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/smart-contract-compiler');
    expect(time).toBeLessThan(2500);
  });
});
