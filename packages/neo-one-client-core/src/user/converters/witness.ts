import { Witness, WitnessModel } from '@neo-one/client-common';

export const witness = (witnessLike: Witness): WitnessModel =>
  new WitnessModel({
    invocation: Buffer.from(witnessLike.invocation, 'hex'),
    verification: Buffer.from(witnessLike.verification, 'hex'),
  });
