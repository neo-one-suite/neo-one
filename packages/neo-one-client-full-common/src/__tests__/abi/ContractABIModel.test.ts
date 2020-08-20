import { ContractParameterTypeModel } from '@neo-one/client-common';
import {
  contractAbiModel,
  contractEventDescriptorModel,
  contractMethodDescriptorModel,
  contractParamDefinitionModel,
} from '../../__data__';

describe('ContractABIModel - serializeJSON', () => {
  test('Simple', () => {
    const json = contractAbiModel().serializeJSON();
    expect(json).toMatchSnapshot();
  });

  test('Multiple', () => {
    const json = contractAbiModel(
      [
        contractMethodDescriptorModel([contractParamDefinitionModel.integer, contractParamDefinitionModel.hash160]),
        contractMethodDescriptorModel([contractParamDefinitionModel.string], ContractParameterTypeModel.Integer),
      ],
      [contractEventDescriptorModel([contractParamDefinitionModel.hash160, contractParamDefinitionModel.hash256])],
    ).serializeJSON();
    expect(json).toMatchSnapshot();
  });
});
