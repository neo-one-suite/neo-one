/* @flow */
import {
  type ConsensusMessage,
  type PrivateKey,
  ChangeViewConsensusMessage,
  ConsensusPayload,
  UnsignedConsensusPayload,
} from '@neo-one/client-core';

import { type Context } from '../../consensus/context';
import ConsensusContext from '../../consensus/ConsensusContext';

import { context } from '../../__data__';
import handleConsensusPayload from '../../consensus/handleConsensusPayload';

const consensusContext = new ConsensusContext();

const makePayload = ({
  context: contextIn,
  consensusMessage,
  privateKey,
}: {|
  context: Context,
  consensusMessage: ConsensusMessage,
  privateKey: PrivateKey,
|}) =>
  ConsensusPayload.sign(
    new UnsignedConsensusPayload({
      version: contextIn.version,
      previousHash: contextIn.previousHash,
      blockIndex: contextIn.blockIndex,
      validatorIndex: contextIn.myIndex,
      consensusMessage,
    }),
    privateKey,
  );

describe('handleConsensusPayload', () => {
  let node = ({}: $FlowFixMe);
  beforeEach(() => {
    node = ({}: $FlowFixMe);
  });

  test('updates the expected view on new view number', async () => {
    const result = await handleConsensusPayload({
      context: context.initialBackupContext,
      node,
      privateKey: context.backupPrivateKey,
      payload: makePayload({
        context: context.blockSentPrimaryContext,
        consensusMessage: new ChangeViewConsensusMessage({
          viewNumber: context.blockSentPrimaryContext.viewNumber,
          newViewNumber: context.blockSentPrimaryContext.viewNumber + 1,
        }),
        privateKey: context.primaryPrivateKey,
      }),
      consensusContext,
    });

    expect(
      result.context.expectedView[context.blockSentPrimaryContext.myIndex],
    ).toEqual(1);
  });
});
