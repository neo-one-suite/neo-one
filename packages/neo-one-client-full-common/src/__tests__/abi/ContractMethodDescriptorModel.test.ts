import { ContractParameterTypeModel } from '@neo-one/client-common';
import { contractMethodDescriptorModel, contractParamDefinitionModel } from '../../__data__';

describe('ContractMethodDescriptorModel - serializeJSON', () => {
  test('Boolean', () => {
    expect(contractMethodDescriptorModel().serializeJSON()).toMatchSnapshot();
  });

  test('Multiple Params', () => {
    expect(
      contractMethodDescriptorModel(
        [
          contractParamDefinitionModel.boolean,
          contractParamDefinitionModel.integer,
          contractParamDefinitionModel.string,
        ],
        ContractParameterTypeModel.String,
      ).serializeJSON(),
    ).toMatchSnapshot();
  });
});
