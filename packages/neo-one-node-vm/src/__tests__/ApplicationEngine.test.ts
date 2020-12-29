import { TriggerType, common, VMState } from '@neo-one/client-common';
import { ApplicationEngine } from '../ApplicationEngine';
import { Dispatcher } from '../Dispatcher';

describe('ApplicationEngine test', () => {
  const dispatcher = new Dispatcher();
  beforeEach(() => {
    dispatcher.reset();
  });
  test('withApplicationEngine -- NOP Script -- Halt', () => {
    const engine = new ApplicationEngine(dispatcher);
    engine.create({
      trigger: TriggerType.Application,
      gas: common.TWENTY_FIXED_8,
    });

    expect(engine.state).toEqual(VMState.BREAK);
  });
});
