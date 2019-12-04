import { BinaryWriter } from '@neo-one/client-common';
import { contractGroupModel } from '../../__data__';

describe('ContractGroupModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Simple', () => {
    contractGroupModel().serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
