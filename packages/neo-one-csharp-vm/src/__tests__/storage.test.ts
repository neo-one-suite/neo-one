import { common, ScriptBuilder, UInt256, WitnessScopeModel } from '@neo-one/client-common';
import {
  ArrayStackItem,
  Block,
  ByteStringStackItem,
  ConsensusData,
  Signer,
  Transaction,
  TriggerType,
  Witness,
} from '@neo-one/csharp-core';
import { BN } from 'bn.js';
import { ApplicationEngine } from '../ApplicationEngine';
import { Dispatcher } from '../Dispatcher';

const createGetBlockScript = (hash: UInt256) => {
  const script = new ScriptBuilder();
  script.emitPushUInt256(hash);
  script.emitSysCall('System.Blockchain.GetBlock');

  return script.build();
};

const genesisHash = common.hexToUInt256('0xecaee33262f1bc7c7c28f2b25b54a5d61d50670871f45c0c6fe755a40cbde4a8');

describe('TS <--> C# Storage Test', () => {
  const dispatcher = new Dispatcher();
  const engine = new ApplicationEngine(dispatcher);
  beforeEach(() => {
    dispatcher.reset();
  });

  test('genesis block -- returns hash', () => {
    engine.create({
      trigger: TriggerType.Application,
      snapshot: 'main',
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
    expect(hashStackItem.value).toEqual(genesisHash);
  });

  test('add a block to the snapshot -- returns Block StackItems', () => {
    const tx = new Transaction({
      script: Buffer.from([0x01]),
      attributes: [],
      signers: [new Signer({ scopes: WitnessScopeModel.Global, account: common.ZERO_UINT160 })],
      networkFee: new BN(0x02),
      systemFee: new BN(0x03),
      nonce: 0x04,
      validUntilBlock: 0x05,
      version: 0x00,
      witnesses: [
        new Witness({
          verification: Buffer.from([0x07]),
          invocation: Buffer.from([]),
        }),
      ],
    });

    const block = new Block({
      index: 0,
      timestamp: new BN(2),
      version: 3,
      witness: new Witness({
        invocation: Buffer.from([]),
        verification: Buffer.from([]),
      }),
      previousHash: common.ZERO_UINT256,
      nextConsensus: common.ZERO_UINT160,
      consensusData: new ConsensusData({ nonce: new BN(1), primaryIndex: 1 }),
      transactions: [tx],
    });

    const script = createGetBlockScript(block.hash);
    dispatcher.withSnapshots(({ main }) => {
      main.addBlock(block);
      main.addTransaction(tx, block.index);
      main.setHeight(block.index);

      engine.create({
        trigger: TriggerType.Application,
        snapshot: 'main',
        gas: 0,
        testMode: true,
      });

      engine.loadScript(script);
      const newState = engine.execute();
      expect(newState).toEqual('HALT');

      const resultStack = engine.resultStack;
      const arr = resultStack[0] as ArrayStackItem;
      const hashFromStackItem = common.asUInt256(arr.value[0].value);
      expect(hashFromStackItem).toEqual(block.hash);
    });
  });
});
