import { contractParamDefinitionModel } from '../../__data__';

describe('ContractParameterModel - serializeJSON', () => {
  test('Boolean', () => {
    expect(contractParamDefinitionModel.boolean.serializeJSON()).toMatchSnapshot();
  });

  test('ByteArray', () => {
    expect(contractParamDefinitionModel.byteArray.serializeJSON()).toMatchSnapshot();
  });

  test('Hash160', () => {
    expect(contractParamDefinitionModel.hash160.serializeJSON()).toMatchSnapshot();
  });

  test('Hash256', () => {
    expect(contractParamDefinitionModel.hash256.serializeJSON()).toMatchSnapshot();
  });

  test('Array', () => {
    expect(contractParamDefinitionModel.array.serializeJSON()).toMatchSnapshot();
  });

  test('Integer', () => {
    expect(contractParamDefinitionModel.integer.serializeJSON()).toMatchSnapshot();
  });

  test('InteropInterface', () => {
    expect(contractParamDefinitionModel.interopInterface.serializeJSON()).toMatchSnapshot();
  });

  test('Map', () => {
    expect(contractParamDefinitionModel.map.serializeJSON()).toMatchSnapshot();
  });

  test('PublicKey', () => {
    expect(contractParamDefinitionModel.publicKey.serializeJSON()).toMatchSnapshot();
  });

  test('Signature', () => {
    expect(contractParamDefinitionModel.signature.serializeJSON()).toMatchSnapshot();
  });

  test('String', () => {
    expect(contractParamDefinitionModel.string.serializeJSON()).toMatchSnapshot();
  });

  test('Void', () => {
    expect(contractParamDefinitionModel.void.serializeJSON()).toMatchSnapshot();
  });
});
