describe('@neo-one/node-vm', () => {
  test('time to import', async () => {
    const time = await one.measureImport('@neo-one/node-vm');
    expect(time).toBeLessThan(600);
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/node-vm');
    expect(time).toBeLessThan(250);
  });
});
