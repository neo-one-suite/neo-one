import { TriggerType } from '@neo-one/node-core';
import { ApplicationEngine } from './ApplicationEngine';
import { ScriptBuilder, common } from '@neo-one/client-common';
import { Block } from '@neo-one/node-core';

const run = () => {
  const script = new ScriptBuilder();
  const engine = new ApplicationEngine({ trigger: TriggerType.Application, snapshot: true, gas: 0, testMode: true });
  const block = new Block();
  script.emitPush(Buffer.from(common.ZERO_UINT256));
  script.emitSysCall('System.Blockchain.GetBlock');

  engine.loadScript(script.build());
  const state = engine.execute();
  console.log(state);

  const stack = engine.resultStack;
  console.log(stack[0]);
};

run();
