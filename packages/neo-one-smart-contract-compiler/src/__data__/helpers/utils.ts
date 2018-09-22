import { addressToScriptHash } from '@neo-one/client';
import { common } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';

export const getUInt160Hash = (value: string) =>
  `Buffer.from('${common.stringToUInt160(value).toString('hex')}', 'hex')`;
export const getUInt256Hash = (value: string) =>
  `Buffer.from('${common.stringToUInt256(value).toString('hex')}', 'hex')`;
export const getAddressHash = (value: string) => getUInt160Hash(addressToScriptHash(value));
export const getBufferHash = (value: string) => `Buffer.from('${value}', 'hex')`;
export const getBuffer = (value: Buffer) => `Buffer.from('${value.toString('hex')}', 'hex')`;
export const getDecimal = (value: BigNumber) => common.fixed8FromDecimal(value).toString(10);
