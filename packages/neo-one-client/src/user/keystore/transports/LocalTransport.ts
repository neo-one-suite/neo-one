import { common, crypto, Witness as WitnessCore } from '@neo-one/client-core';
import { BufferString } from '../../../types';
import { TransportNode } from '../TransportStore';

const sign = async ({ message, key }: { readonly message: Buffer; readonly key: BufferString }): Promise<WitnessCore> =>
  crypto.createWitness(message, common.stringToPrivateKey(key));

// tslint:disable-next-line:variable-name
export const LocalTransport: TransportNode = {
  type: 'local',
  sign,
};
