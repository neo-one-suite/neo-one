import { ScriptBuilder } from '@neo-one/client-common';
import { TriggerType } from '@neo-one/csharp-core';
import { ApplicationEngine } from '../ApplicationEngine';
import { Dispatcher } from '../Dispatcher';

describe('Dispatcher Tests', () => {
  const dispatcher = new Dispatcher();
  beforeEach(() => {
    dispatcher.reset();
  });

  test('withApplicationEngine -- NOP Script', () => {
    const state = dispatcher.withApplicationEngine(
      {
        trigger: TriggerType.Application,
        testMode: true,
        gas: 0,
      },
      (engine) => {
        expect(engine.state).toEqual('BREAK');

        const script = new ScriptBuilder();
        script.emitOp('NOP');

        engine.loadScript(script.build());

        return engine.execute();
      },
    );

    expect(state).toEqual('HALT');

    // check that the dispatcher reset the engine.
    const postEngine = new ApplicationEngine(dispatcher);
    expect(postEngine.resultStack).toEqual([]);
    expect(postEngine.gasConsumed).toEqual(0);
    expect(postEngine.state).toEqual('BREAK');
    expect(() => postEngine.execute()).toThrow();
  });
});
