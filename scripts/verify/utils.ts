// tslint:disable no-implicit-dependencies
import { scriptHashToAddress } from '@neo-one/client-common';
import { BinaryReader } from '@neo-one/node-core';
import _ from 'lodash';

export const reverse = (src: Buffer): Buffer => {
  const mutableOut = Buffer.allocUnsafe(src.length);
  // tslint:disable-next-line no-loop-statement
  for (let i = 0, j = src.length - 1; i <= j; i += 1, j -= 1) {
    mutableOut[i] = src[j];
    mutableOut[j] = src[i];
  }

  return mutableOut;
};

export const reverseByteString = (src: string): string => reverse(Buffer.from(src, 'hex')).toString('hex');

export const getPartsFromKey = (storageKey: string) => {
  const scriptHash = `0x${reverse(Buffer.from(storageKey.slice(0, 40), 'hex')).toString('hex')}`;
  const keyRaw = storageKey.slice(40);
  const padding = parseInt(keyRaw.substring(keyRaw.length - 2), 16);
  const key = keyRaw.substring(0, keyRaw.length - (padding + 1) * 2);
  const keyFixed = _.chunk([...key], 34)
    .map((chunk) => chunk.slice(0, 32))
    .reduce((acc, chunk) => acc + chunk.join(''), '');

  return {
    scriptHash,
    address: scriptHashToAddress(scriptHash),
    key: keyFixed,
  };
};

export const getValue = (storageValue: string) => {
  const rawValue = storageValue.substring(2, storageValue.length - 2);
  const binaryReader = new BinaryReader(Buffer.from(rawValue, 'hex'));

  return binaryReader.readVarBytesLE().toString('hex');
};
