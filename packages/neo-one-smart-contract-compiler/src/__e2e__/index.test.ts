describe('@neo-one/smart-contract-compiler', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/smart-contract-compiler');
    expect(time).toBeLessThan(2500);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/smart-contract-compiler');
    expect(time).toBeLessThan(1250);
  });
});
