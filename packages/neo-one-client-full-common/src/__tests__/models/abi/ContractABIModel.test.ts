import { BinaryWriter, ContractParameterTypeModel } from '@neo-one/client-common';
import { contractAbiModel, contractEventModel, contractFunctionModel, contractParamModel } from '../../../__data__';

describe('ContractABIModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Simple', () => {
    contractAbiModel().serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Multiple', () => {
    contractAbiModel(
      [
        contractFunctionModel([contractParamModel.integer, contractParamModel.hash160]),
        contractFunctionModel([contractParamModel.string], ContractParameterTypeModel.Integer),
      ],
      [contractEventModel([contractParamModel.hash160, contractParamModel.hash256])],
    ).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
