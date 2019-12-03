import { BinaryWriter, ContractParameterTypeModel } from '@neo-one/client-common';
import { contractFunctionModel, contractParamModel } from '../../../__data__';

describe('ContractFunctionModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Boolean', () => {
    contractFunctionModel().serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Multiple Params', () => {
    contractFunctionModel(
      [contractParamModel.boolean, contractParamModel.integer, contractParamModel.string],
      ContractParameterTypeModel.String,
    ).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
