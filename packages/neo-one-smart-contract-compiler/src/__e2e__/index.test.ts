import * as api from '@neo-one/smart-contract-compiler';

describe('@neo-one/smart-contract-compiler', () => {
  const EXPECTED = ['compileContract', 'scan', 'getSemanticDiagnostics'];

  test('has expected exports', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/smart-contract-compiler');
    expect(time).toBeLessThan(2500);
  });
});
