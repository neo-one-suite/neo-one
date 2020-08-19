import { common, ScriptBuilder, UInt256 } from '@neo-one/client-common';
import { ArrayStackItem, ByteStringStackItem, TriggerType } from '@neo-one/csharp-core';
import { ApplicationEngine } from '../ApplicationEngine';

const createGetBlockScript = (hash: UInt256) => {
  const script = new ScriptBuilder();
  script.emitPushUInt256(hash);
  script.emitSysCall('System.Blockchain.GetBlock');

  return script.build();
};

const genesisHash = common.hexToUInt256('0xecaee33262f1bc7c7c28f2b25b54a5d61d50670871f45c0c6fe755a40cbde4a8');

describe('TS <--> C# Storage Test', () => {
  test('genesis block', () => {
    const engine = new ApplicationEngine({
      trigger: TriggerType.Application,
      snapshot: true,
      gas: 0,
      testMode: true,
    });
    const script = createGetBlockScript(genesisHash);

    engine.loadScript(script);
    const state = engine.execute();
    expect(state).toEqual('HALT');

    const stack = engine.resultStack;
    const result = stack[0] as ArrayStackItem;

    const hashStackItem = result.value[0] as ByteStringStackItem;
    expect(hashStackItem._buffer).toEqual(genesisHash);
  });
});
