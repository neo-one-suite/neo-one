import { InvalidFormatError } from '@neo-one/client-common';
import { BN } from 'bn.js';
import LZ4 from 'lz4';

const decompress = (bytes: Buffer, max: number) => {
  const length = new BN(bytes.slice(0, 4), 'le').toNumber();
  if (length < 0 || length > max) {
    throw new InvalidFormatError();
  }

  const uncompressed = Buffer.alloc(length);
  const uncompressedSize = LZ4.decodeBlock(bytes, uncompressed, 4);

  if (uncompressedSize !== length) {
    throw new InvalidFormatError();
  }

  return uncompressed;
};

const compress = (bytes: Buffer) => {
  const maxLength = LZ4.encodeBound(bytes.length);
  const encoded = Buffer.alloc(maxLength);
  const length = LZ4.encodeBlock(bytes, encoded);
  const result = encoded.slice(0, length);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeInt32LE(bytes.length, 0);

  return Buffer.concat([lengthBuffer, result]);
};

export const lz4Helper = {
  decompress,
  compress,
};
