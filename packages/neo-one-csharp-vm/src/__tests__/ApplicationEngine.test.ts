import { TriggerType } from '@neo-one/csharp-core';
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
      gas: 0,
      testMode: true,
    });

    expect(engine.state).toEqual('BREAK');
  });
});
