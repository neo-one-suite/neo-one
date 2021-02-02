import { nep17 } from '@neo-one/client-core';
import { genManifest } from '../../manifest';

describe('genManifest', () => {
  test('NEP17', () => {
    expect(genManifest('Token', nep17.manifest(4))).toMatchSnapshot();
  });
});
