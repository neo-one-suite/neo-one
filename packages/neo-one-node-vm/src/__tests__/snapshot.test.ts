import { TriggerType, common, VMState } from '@neo-one/client-common';
import { ApplicationEngine } from '../ApplicationEngine';
import { Dispatcher } from '../Dispatcher';

describe('ApplicationEngine test', () => {
  const dispatcher = new Dispatcher();
  beforeEach(() => {
    dispatcher.reset();
  });
  test('withApplicationEngine -- NOP Script -- Halt', () => {
    dispatcher.withSnapshots(({ main }) => {
      main.changeBlockHashIndex(1, common.ZERO_UINT256);

      console.log(dispatcher.test());
    });
  });
});
