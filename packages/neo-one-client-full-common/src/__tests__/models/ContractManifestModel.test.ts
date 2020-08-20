import { contractManifestModel } from '../../__data__';

describe('ContractManifestModel - serializeJSON', () => {
  test('Simple', () => {
    expect(contractManifestModel().serializeJSON()).toMatchSnapshot();
  });
});
