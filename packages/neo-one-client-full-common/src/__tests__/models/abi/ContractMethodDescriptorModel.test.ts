import { BinaryWriter, ContractParameterTypeModel } from '@neo-one/client-common';
import { contractMethodDescriptorModel, contractParamModel } from '../../../__data__';

describe('ContractMethodDescriptorModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Boolean', () => {
    contractMethodDescriptorModel().serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Multiple Params', () => {
    contractMethodDescriptorModel(
      [contractParamModel.boolean, contractParamModel.integer, contractParamModel.string],
      ContractParameterTypeModel.String,
    ).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
