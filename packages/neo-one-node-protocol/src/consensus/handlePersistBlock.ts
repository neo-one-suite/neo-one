import { ECPoint } from '@neo-one/client-core';
import { Blockchain } from '@neo-one/node-core';
import { initializeNewConsensus } from './common';
import { ConsensusContext } from './ConsensusContext';
import { InitialContext } from './context';
import { Result } from './types';

export const handlePersistBlock = async ({
  blockchain,
  publicKey,
  consensusContext,
}: {
  readonly blockchain: Blockchain;
  readonly publicKey: ECPoint;
  readonly consensusContext: ConsensusContext;
}): Promise<Result<InitialContext>> =>
  initializeNewConsensus({
    blockchain,
    publicKey,
    consensusContext,
  });
