// wallaby.skip
import { common, crypto, Op, UInt256Hex } from '@neo-one/client-common';
import {
  Block,
  ChangeViewConsensusMessage,
  ChangeViewReason,
  ConsensusContext,
  Header,
  TransactionVerificationContext,
  Witness,
} from '@neo-one/node-core';
import { BN } from 'bn.js';
import { context, keys } from '../../__data__';
import { handleConsensusPayload } from '../../handleConsensusPayload';
import { makeSignedPayload } from '../../makePayload';
import { TimerContext } from '../../TimerContext';

const timerContext = new TimerContext();

describe('handleConsensusPayload', () => {
  // tslint:disable-next-line no-any
  let node = {} as any;
  const getGasBalance = jest.fn(() => Promise.resolve(new BN(0)));
  let backupContext: ConsensusContext;
  let knownHashes: Set<UInt256Hex>;
  const blockchain = {
    getNextBlockValidators: jest.fn(() => keys.map(({ publicKey }) => publicKey)),
    getValidators: jest.fn(() => keys.map(({ publicKey }) => publicKey)),
    deserializeWireContext: {
      network: 2345123,
    },
  };
  const validatorIndex = 10;
  const blockIndex = 100;
  beforeEach(() => {
    node = {
      getNewTransactionVerificationContext: jest.fn(() => new TransactionVerificationContext({ getGasBalance })),
      blockchain,
      // tslint:disable-next-line no-any
    } as any;
    backupContext = context.getBackupContext(getGasBalance);
    knownHashes = new Set<UInt256Hex>();
  });

  // TODO: fixup
  test('updates the expected view on new view number', async () => {
    const payload = await makeSignedPayload({
      node,
      context: backupContext,
      consensusMessage: new ChangeViewConsensusMessage({
        viewNumber: backupContext.viewNumber,
        timestamp: new BN(Date.now()),
        reason: ChangeViewReason.ChangeAgreement,
        validatorIndex,
        blockIndex,
      }),

      privateKey: context.backupPrivateKey,
    });

    const result = await handleConsensusPayload({
      context: backupContext,
      node,
      knownHashes,
      privateKey: context.backupPrivateKey,
      payload: await makeSignedPayload({
        node,
        context: backupContext,
        consensusMessage: new ChangeViewConsensusMessage({
          viewNumber: backupContext.viewNumber,
          timestamp: new BN(Date.now()),
          reason: ChangeViewReason.ChangeAgreement,
          validatorIndex,
          blockIndex,
        }),

        privateKey: context.backupPrivateKey,
      }),

      timerContext,
    });
  });

  // TODO: fixup
  test.only('settings help', () => {
    const privateKeyString = 'e35fa5d1652c4c65e296c86e63a3da6939bc471b741845be636e2daa320dc770';
    const privateKey = common.stringToPrivateKey(privateKeyString);
    const publicKey = crypto.privateKeyToPublicKey(privateKey);

    const standbyValidators = [publicKey];

    const consensusAddress = crypto.getBFTAddress(standbyValidators);

    const deployWitness = new Witness({
      invocation: Buffer.from([]),
      verification: Buffer.from([Op.PUSH1]),
    });

    const genesisBlock = new Block({
      header: new Header({
        merkleRoot: common.ZERO_UINT256,
        nonce: new BN(Math.random() * 100000),
        primaryIndex: 1,
        previousHash: common.ZERO_UINT256,
        timestamp: new BN(Date.now()),
        index: 0,
        nextConsensus: consensusAddress,
        witness: deployWitness,
        network: 7630401,
      }),
      transactions: [],
    });
  });
});
