import { abiFactory, testUtils } from '../../__data__';

describe('ABI Functions Tests - single parameter', () => {
  const ABIs = abiFactory.createBaseABIFunctionParameters();
  ABIs.forEach((abi) => {
    testUtils.testABI(abi, abi.functions[0].name);
  });
});
