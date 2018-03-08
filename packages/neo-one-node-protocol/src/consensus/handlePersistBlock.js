/* @flow */
import { type ECPoint } from '@neo-one/client-core';
import { type Blockchain } from '@neo-one/node-core';

import type { InitialContext } from './context';
import type { Result } from './types';
import type ConsensusContext from './ConsensusContext';

import { initializeNewConsensus } from './common';

export default async ({
  blockchain,
  publicKey,
  consensusContext,
}: {|
  blockchain: Blockchain,
  publicKey: ECPoint,
  consensusContext: ConsensusContext,
|}): Promise<Result<InitialContext>> =>
  initializeNewConsensus({
    blockchain,
    publicKey,
    consensusContext,
  });
