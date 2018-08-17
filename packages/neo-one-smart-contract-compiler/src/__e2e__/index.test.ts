// tslint:disable-next-line no-implicit-dependencies
import * as api from '@neo-one/smart-contract-compiler';

describe('@neo-one/smart-contract-compiler', () => {
  const EXPECTED = ['compileContract', 'scan', 'getSemanticDiagnostics'];

  test('has expected exports', () => {
    // tslint:disable-next-line no-array-mutation no-misleading-array-reverse
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/smart-contract-compiler');
    expect(time).toBeLessThan(2500);
  });
});
