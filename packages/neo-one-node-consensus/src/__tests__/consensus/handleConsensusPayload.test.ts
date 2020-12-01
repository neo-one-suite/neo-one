// wallaby.skip
import { common, crypto, Op, PrivateKey, ScriptBuilder, UInt256Hex, WitnessScopeModel } from '@neo-one/client-common';
import {
  Block,
  ChangeViewConsensusMessage,
  ChangeViewReason,
  ConsensusContext,
  ConsensusData,
  Contract,
  Signer,
  Transaction,
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
  let primaryContext: ConsensusContext;
  let knownHashes: Set<UInt256Hex>;
  const blockchain = {
    getNextBlockValidators: jest.fn(() => keys.map(({ publicKey }) => publicKey)),
    getValidators: jest.fn(() => keys.map(({ publicKey }) => publicKey)),
    deserializeWireContext: {
      messageMagic: 2345123,
    },
  };
  beforeEach(() => {
    node = {
      getNewTransactionVerificationContext: jest.fn(() => new TransactionVerificationContext({ getGasBalance })),
      blockchain,
      // tslint:disable-next-line no-any
    } as any;
    backupContext = context.getBackupContext(getGasBalance);
    primaryContext = context.getPrimaryContext(getGasBalance);
    knownHashes = new Set<UInt256Hex>();
  });

  test('updates the expected view on new view number', async () => {
    const payload = await makeSignedPayload({
      node,
      context: backupContext,
      consensusMessage: new ChangeViewConsensusMessage({
        viewNumber: backupContext.viewNumber,
        timestamp: new BN(Date.now()),
        reason: ChangeViewReason.ChangeAgreement,
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
        }),

        privateKey: context.backupPrivateKey,
      }),

      timerContext,
    });

    console.log(result);
  });

  test.only('settings help', () => {
    const privateKeyString = 'e35fa5d1652c4c65e296c86e63a3da6939bc471b741845be636e2daa320dc770';
    const privateKey = common.stringToPrivateKey(privateKeyString);
    const publicKey = crypto.privateKeyToPublicKey(privateKey);
    const publicKeyString = common.ecPointToHex(publicKey);

    // console.log({ privateKey: privateKeyString, publicKey: publicKeyString });

    const standbyValidators = [publicKey];

    const consensusAddress = crypto.getConsensusAddress(standbyValidators);

    const deployWitness = new Witness({
      invocation: Buffer.from([]),
      verification: Buffer.from([Op.PUSH1]),
    });

    const scriptBuilder = new ScriptBuilder();
    scriptBuilder.emitSysCall('Neo.Native.Deploy');
    const script = scriptBuilder.build();

    const deployTransaction = new Transaction({
      version: 0,
      script,
      systemFee: new BN(0),
      networkFee: new BN(0),
      signers: [
        new Signer({
          account: crypto.hash160(Buffer.from([Op.PUSH1])),
          scopes: WitnessScopeModel.None,
        }),
      ],
      attributes: [],
      witnesses: [deployWitness],
      validUntilBlock: 0,
      messageMagic: 7630401,
    });

    const consensusData = new ConsensusData({
      primaryIndex: 0,
      nonce: new BN(2083236893),
    });

    const genesisBlock = new Block({
      previousHash: common.ZERO_UINT256,
      timestamp: new BN(Date.now()),
      index: 0,
      nextConsensus: consensusAddress,
      witness: deployWitness,
      consensusData,
      transactions: [deployTransaction],
      messageMagic: 7630401,
    });

    console.log(deployTransaction.hash);
    console.log(consensusData);

    const serializedBlock = genesisBlock.serializeWire();
    console.log(serializedBlock.toString('hex'));
  });
});
