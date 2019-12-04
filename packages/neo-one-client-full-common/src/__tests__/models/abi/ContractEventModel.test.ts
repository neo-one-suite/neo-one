import { BinaryWriter } from '@neo-one/client-common';
import { contractEventModel, contractParamModel } from '../../../__data__';

describe('ContractEventModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Boolean', () => {
    contractEventModel().serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Multiple Params', () => {
    contractEventModel([
      contractParamModel.boolean,
      contractParamModel.integer,
      contractParamModel.string,
    ]).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
