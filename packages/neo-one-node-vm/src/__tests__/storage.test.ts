import {
  CallFlags,
  common,
  ScriptBuilder,
  TriggerType,
  UInt256,
  VMState,
  WitnessScopeModel,
} from '@neo-one/client-common';
import { assertArrayStackItem, Block, Signer, Transaction, Witness } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { Dispatcher } from '../Dispatcher';

const createGetBlockScript = (hash: UInt256) => {
  const sb = new ScriptBuilder();
  sb.emitDynamicAppCall(common.nativeHashes.Ledger, 'getBlock', CallFlags.All, hash);

  return sb.build();
};

// if these tests break when we go to mainnet it is likely the message magic
describe('TS <--> C# Storage Test', () => {
  const messageMagic = 5195086;
  test('add a block to the snapshot -- returns Block StackItems -- memory', () => {
    const dispatcher = new Dispatcher(); // initialization creates store using MemoryStore()
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
      messageMagic,
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
      messageMagic,
    });

    const script = createGetBlockScript(block.hash);
    dispatcher.withSnapshots(({ main }) => {
      // main.addBlock(block);
      // main.addTransaction(tx, block.index);
      // main.changeBlockHashIndex(block.index, block.hash);

      dispatcher.withApplicationEngine(
        {
          trigger: TriggerType.Application,
          snapshot: 'main',
          gas: common.TWENTY_FIXED8,
          persistingBlock: block,
        },
        (engine) => {
          engine.loadScript({ script });
          const newState = engine.execute();
          expect(newState).toEqual(VMState.HALT);

          const resultStack = engine.resultStack;
          const arr = assertArrayStackItem(resultStack[0]).array;
          const hash = common.asUInt256(arr[0].getBuffer());
          expect(hash).toEqual(block.hash);
        },
      );
    });
  });

  test.skip('add a block to the snapshot -- returns Block StackItems -- leveldb', () => {
    const dispatcher = new Dispatcher({ levelDBPath: '/Users/spencercorwin/Desktop/test-location' });
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
      messageMagic,
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
      messageMagic,
    });

    const script = createGetBlockScript(block.hash);
    dispatcher.withSnapshots(({ main }) => {
      // main.addBlock(block);
      // main.addTransaction(tx, block.index);
      // main.changeBlockHashIndex(block.index, block.hash);

      dispatcher.withApplicationEngine(
        {
          trigger: TriggerType.Application,
          snapshot: 'main',
          gas: common.TWENTY_FIXED8,
        },
        (engine) => {
          engine.loadScript({ script });
          const newState = engine.execute();
          expect(newState).toEqual('HALT');

          const resultStack = engine.resultStack;
          const arr = assertArrayStackItem(resultStack[0]).array;
          const hashFromStackItem = common.asUInt256(arr[0].getBuffer());
          expect(hashFromStackItem).toEqual(block.hash);
        },
      );
    });
  });
});
