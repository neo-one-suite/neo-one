import { abiFactory, testUtils } from '../../__data__';

describe('ABIFunction Tests - No Parameters', () => {
  const ABIs = abiFactory.createBaseABIFunctions();
  ABIs.forEach((abi) => testUtils.testABI(abi, abi.functions[0].name));
});
