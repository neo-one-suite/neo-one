import { contractGroupModel } from '../../__data__';

describe('ContractGroupModel - serializeJSON', () => {
  test('Simple', () => {
    expect(contractGroupModel().serializeJSON()).toMatchSnapshot();
  });
});
