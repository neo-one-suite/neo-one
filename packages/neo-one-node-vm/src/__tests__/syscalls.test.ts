import { common, ScriptBuilder, TriggerType } from '@neo-one/client-common';
import { Block, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';
import { ApplicationEngine } from '../ApplicationEngine';
import { Dispatcher } from '../Dispatcher';

describe('Application Engine SysCall Tests', () => {
  const dispatcher = new Dispatcher();
  const engine = new ApplicationEngine(dispatcher);
  let script: ScriptBuilder;
  beforeEach(() => {
    dispatcher.reset();
    engine.create({
      trigger: TriggerType.Application,
      gas: common.TWENTY_FIXED8,
    });

    script = new ScriptBuilder();
  });

  describe('System.Json.Deserialize', () => {
    test('Halt -- Good values', () => {
      script.emitPushString('123');
      script.emitSysCall('System.Json.Deserialize');
      script.emitPushString('null');
      script.emitSysCall('System.Json.Deserialize');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('HALT');

      const resultStack = engine.resultStack;
      expect(resultStack[0].isNull).toEqual(true);
      expect(resultStack[1].getInteger().toNumber()).toEqual(123);
    });

    test('Fault -- Wrong Json', () => {
      script.emitPushString('***');
      script.emitSysCall('System.Json.Deserialize');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('FAULT');
      expect(engine.resultStack.length).toEqual(0);
    });

    test('Fault -- No decimals', () => {
      script.emitPushString('123.45');
      script.emitSysCall('System.Json.Deserialize');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('FAULT');
      expect(engine.resultStack.length).toEqual(0);
    });
  });

  describe('System.Json.Serialize', () => {
    test('Halt -- Good values', () => {
      script.emitPushInt(5);
      script.emitSysCall('System.Json.Serialize');
      script.emitOp('PUSH0');
      script.emitOp('NOT');
      script.emitSysCall('System.Json.Serialize');
      script.emitPushString('test');
      script.emitSysCall('System.Json.Serialize');
      script.emitOp('PUSHNULL');
      script.emitSysCall('System.Json.Serialize');
      script.emitOp('NEWMAP');
      script.emitOp('DUP');
      script.emitPushString('key');
      script.emitPushString('value');
      script.emitOp('SETITEM');
      script.emitSysCall('System.Json.Serialize');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('HALT');

      const resultStack = engine.resultStack;
      expect(resultStack.length).toEqual(5);

      expect(resultStack[0].getString()).toEqual('{"key":"value"}');
      expect(resultStack[1].getString()).toEqual('null');
      expect(resultStack[2].getString()).toEqual('"test"');
      expect(resultStack[3].getString()).toEqual('true');
      expect(resultStack[4].getString()).toEqual('5');
    });

    test('Fault -- Bad values', () => {
      script.emitSysCall('System.Storage.GetContext');
      script.emitSysCall('System.Json.Serialize');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('FAULT');
      expect(engine.resultStack.length).toEqual(0);
    });
  });

  test('System.Callback.Invoke -- Halt', () => {
    engine.create({
      trigger: TriggerType.Application,
      gas: common.TWENTY_FIXED8,
    });

    script = new ScriptBuilder();

    script.emitPushInt(5); // Callback argument 1
    script.emitPushInt(1); // Callback argument 2
    script.emitPushInt(2); // ParamCount
    script.emitOp('PACK');
    script.emitPushInt(2); // ParamCount
    script.emitOp('PUSHA', new BN(200).toArrayLike(Buffer, 'le', 4)); // -> Nop area
    script.emitSysCall('System.Callback.Create');
    script.emitSysCall('System.Callback.Invoke');
    script.emitOp('RET');
    _.range(250).forEach(() => {
      script.emitOp('NOP');
    });
    script.emitOp('SUB');
    script.emitOp('RET');

    engine.loadScript({ script: script.build() });
    const state = engine.execute();
    expect(state).toEqual('HALT');

    const resultStack = engine.resultStack;
    expect(resultStack.length).toEqual(1);
    expect(resultStack[0].getInteger().eq(new BN(4))).toEqual(true);
  });

  test('System.Callback.CreateFromSyscall -- Halt', () => {
    engine.create({
      trigger: TriggerType.Application,
      gas: common.TWENTY_FIXED8,
    });

    script = new ScriptBuilder();

    script.emitPush(Buffer.from([]));
    script.emitPushInt(1);
    script.emitOp('PACK');
    script.emitSysCallName('Neo.Crypto.SHA256');
    script.emitSysCall('System.Callback.CreateFromSyscall');
    script.emitSysCall('System.Callback.Invoke');

    engine.loadScript({ script: script.build() });
    const state = engine.execute();
    expect(state).toEqual('HALT');

    const resultStack = engine.resultStack;
    expect(resultStack.length).toEqual(1);
    expect(resultStack[0].getBuffer().toString('hex')).toEqual(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  describe('System.Blockchain.GetBlock', () => {
    const block = new Block({
      index: 0,
      timestamp: new BN(2),
      version: 3,
      witness: new Witness({ invocation: Buffer.from([]), verification: Buffer.from([]) }),
      previousHash: common.ZERO_UINT256,
      merkleRoot: common.ZERO_UINT256,
      nextConsensus: common.ZERO_UINT160,
      transactions: [],
      messageMagic: 1951352142,
    });

    test('With Snapshot option -- Halt', () => {
      engine.create({
        trigger: TriggerType.Application,
        gas: common.TWENTY_FIXED8,
        snapshot: 'main',
      });
      script.emitPushUInt256(block.hash);
      script.emitSysCall('System.Blockchain.GetBlock');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('HALT');

      const stack = engine.resultStack;
      expect(stack.length).toEqual(1);
      expect(stack[0].isNull).toEqual(true);
    });

    test('Without Snapshot option -- Fault', () => {
      engine.create({ trigger: TriggerType.Application, gas: common.TWENTY_FIXED8 });
      script.emitPushUInt256(block.hash);
      script.emitSysCall('System.Blockchain.GetBlock');

      engine.loadScript({ script: script.build() });
      const state = engine.execute();
      expect(state).toEqual('FAULT');
    });
  });
});
