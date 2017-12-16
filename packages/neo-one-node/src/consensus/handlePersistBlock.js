/* @flow */
import { type ECPoint } from '@neo-one/core';
import { type Blockchain } from '@neo-one/node-core';

import type { InitialContext } from './context';
import type { Result } from './types';

import { initializeNewConsensus } from './common';

export default async ({
  blockchain,
  publicKey,
}: {|
  blockchain: Blockchain,
  publicKey: ECPoint,
|}): Promise<Result<InitialContext>> =>
  initializeNewConsensus({
    blockchain,
    publicKey,
  });
