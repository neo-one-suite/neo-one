import {
  assertContractParameterType,
  assertContractParameterTypeJSON,
  ContractParameterTypeModel,
  toContractParameterType,
  toJSONContractParameterType,
} from '../../models/ContractParameterTypeModel';

describe('Contract Parameter Type - Functions', () => {
  const goodNum = ContractParameterTypeModel.String;
  const goodString = 'String';

  test('To Contract Parameter', () => {
    const toContractParameter = toContractParameterType(goodString);
    expect(toContractParameter).toEqual(goodNum);
  });
  test('To JSON Contract Parameter', () => {
    const toJSONContractParameter = toJSONContractParameterType(goodNum);
    expect(toJSONContractParameter).toEqual(goodString);
  });
});

describe('Contract Parameter Type - Errors', () => {
  const badNum = 50;
  const badString = '50';

  test('Errors', () => {
    const contractParameterThrow = () => assertContractParameterType(badNum);
    expect(contractParameterThrow).toThrowError(`Expected contract parameter type, found: ${badNum.toString(16)}`);
  });
  test('assertContractParameterTypeJSON - badString', () => {
    const contractParameterJSONThrow = () => assertContractParameterTypeJSON(badString);
    expect(contractParameterJSONThrow).toThrowError(`Invalid ContractParameterType: ${badString}`);
  });
});
