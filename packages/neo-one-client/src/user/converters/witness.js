/* @flow */
import { Witness } from '@neo-one/client-core';

import type { Witness as ClientWitness } from '../../types';

export default (witnessLike: ClientWitness): Witness =>
  new Witness({
    invocation: Buffer.from(witnessLike.invocation, 'hex'),
    verification: Buffer.from(witnessLike.verification, 'hex'),
  });
