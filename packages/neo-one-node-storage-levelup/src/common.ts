import { common, UInt256 } from '@neo-one/client-common';

export const serializeHeaderHash = (hash: UInt256): Buffer => common.uInt256ToBuffer(hash);
export const deserializeHeaderHash = (hash: Buffer): UInt256 => common.bufferToUInt256(hash);

export const serializeBlockHash = (hash: UInt256): Buffer => common.uInt256ToBuffer(hash);
export const deserializeBlockHash = (hash: Buffer): UInt256 => common.bufferToUInt256(hash);
