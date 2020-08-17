import { ScriptBuilder } from '@neo-one/client-common';
import { TriggerType } from '@neo-one/node-core';
import { withApplicationEngine } from '../ApplicationEngine';

describe('ApplicationEngine test', () => {
  test('NOP Script -- Halt', () => {
    const state = withApplicationEngine(
      {
        trigger: TriggerType.Application,
        testMode: true,
        gas: 100_000_000,
      },
      (engine) => {
        const initState = engine.state;
        expect(initState).toEqual('BREAK');

        const script = new ScriptBuilder();
        script.emitOp('NOP');

        engine.loadScript(script.build());

        return engine.execute();
      },
    );

    expect(state).toEqual('HALT');
  });
});
