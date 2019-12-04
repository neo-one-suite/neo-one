import { BinaryWriter } from '@neo-one/client-common';
import { contractManifestModel } from '../../__data__';

describe('ContractManifestModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Simple', () => {
    contractManifestModel().serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
