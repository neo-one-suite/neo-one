// tslint:disable-next-line no-implicit-dependencies
import * as api from '@neo-one/smart-contract-test';

describe('@neo-one/smart-contract-test', () => {
  const EXPECTED = ['withContracts'];

  test('has expected exports', () => {
    // tslint:disable-next-line no-array-mutation no-misleading-array-reverse
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/smart-contract-test');
    expect(time).toBeLessThan(2500);
  });
});
