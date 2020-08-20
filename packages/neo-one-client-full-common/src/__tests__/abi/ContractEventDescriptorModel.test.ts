import { contractEventDescriptorModel, contractParamDefinitionModel } from '../../__data__';

describe('ContractEventDescriptorModel - serializeJSON', () => {
  test('Boolean', () => {
    expect(contractEventDescriptorModel().serializeJSON()).toMatchSnapshot();
  });

  test('Multiple Params', () => {
    expect(
      contractEventDescriptorModel([
        contractParamDefinitionModel.boolean,
        contractParamDefinitionModel.integer,
        contractParamDefinitionModel.string,
      ]),
    ).toMatchSnapshot();
  });
});
