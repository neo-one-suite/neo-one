import { abiFactory, testUtils } from '../../__data__';

describe('ABIEvent Tests', () => {
  const ABIs = abiFactory.createBaseABIEvents();
  ABIs.forEach((abi) => {
    if (abi.events === undefined) {
      throw new Error('it should be defined');
    }
    testUtils.testABI(abi, abi.events[0].name);
  });
});
