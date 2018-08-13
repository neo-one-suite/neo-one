import * as api from '@neo-one/smart-contract-test';

describe('@neo-one/smart-contract-test', () => {
  const EXPECTED = ['setupContractTest'];

  test('has expected exports', () => {
    expect(Object.keys(api).sort()).toEqual(EXPECTED.sort());
  });

  test('time to require', async () => {
    const time = await one.measureRequire('@neo-one/smart-contract-test');
    expect(time).toBeLessThan(2500);
  });
});
