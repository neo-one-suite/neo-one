import { factory } from '../../__data__';
import { ContractStackItem } from '../../stackItem';

describe('Object Stack Item', () => {
  const contract = factory.createContract();
  const contractStackItem = new ContractStackItem(contract);

  test('asBoolean', () => {
    expect(contractStackItem.asBoolean()).toBeTruthy();
  });

  test('asBuffer - throws', () => {
    expect(() => contractStackItem.asBuffer()).toThrowError('Invalid Value. Expected Buffer');
  });

  test('toContractParameter', () => {
    expect(contractStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('serialize - Throws', () => {
    expect(() => contractStackItem.serialize()).toThrowError('Unsupported StackItem serde.');
  });
});
