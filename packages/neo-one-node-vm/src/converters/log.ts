import { common } from '@neo-one/client-common';
import { VMLog } from '@neo-one/node-core';

export interface LogReturn {
  readonly containerHash?: Buffer;
  readonly callingScriptHash: Buffer;
  readonly message: string;
  // TODO
  // readonly position: number;
}

export const convertLog = ({ containerHash, callingScriptHash, message }: LogReturn): VMLog => ({
  containerHash: containerHash ? common.asUInt256(containerHash) : undefined,
  callingScriptHash: common.asUInt160(callingScriptHash),
  message,
  // TODO
  // position,
});
