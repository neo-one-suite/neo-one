import { Witness } from '@neo-one/client-core';
import { Witness as ClientWitness } from '../../types';

export const witness = (witnessLike: ClientWitness): Witness =>
  new Witness({
    invocation: Buffer.from(witnessLike.invocation, 'hex'),
    verification: Buffer.from(witnessLike.verification, 'hex'),
  });
