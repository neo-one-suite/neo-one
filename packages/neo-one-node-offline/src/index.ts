/// <reference types="@neo-one/types" />
import { BinaryReader, Block, Blockchain, DeserializeWireContext } from '@neo-one/node-core';
import { makeErrorWithCode } from '@neo-one/utils';
import * as fs from 'fs';
import _ from 'lodash';
import { Readable, Transform, Writable } from 'stream';
import * as zlib from 'zlib';

export const InvalidBlockTransformEncodingError = makeErrorWithCode(
  'INVALID_BLOCK_TRANSFORM_ENCODING',
  (message: string) => message,
);

const SIZE_OF_INT32 = 4;

class BlockTransform extends Transform {
  public readonly context: DeserializeWireContext;
  private mutableBuffers: Buffer[];
  private mutableLength: number;

  public constructor(context: DeserializeWireContext) {
    super({ readableObjectMode: true });
    this.context = context;
    this.mutableBuffers = [];
    this.mutableLength = 0;
  }

  public _transform(
    chunk: Buffer | string,
    encoding: string,
    callback: (error: Error | undefined, data?: Buffer | string) => void,
  ): void {
    if (typeof chunk === 'string') {
      throw new InvalidBlockTransformEncodingError(
        `Invalid Block Transform Chunk Type. Expected chunk type to be 'string', found: ${typeof chunk}`,
      );
    }
    if (encoding !== 'buffer') {
      throw new InvalidBlockTransformEncodingError(
        `Invalid Block Transform Encoding. Expected: 'buffer', found: ${encoding}`,
      );
    }

    this.mutableBuffers.push(chunk);
    this.mutableLength += chunk.length;
    if (this.mutableLength < 100000) {
      callback(undefined);

      return;
    }

    try {
      const { remainingBuffer, mutableBlocks } = this.processBuffer(
        new BinaryReader(Buffer.concat(this.mutableBuffers)),
      );
      this.mutableBuffers = [remainingBuffer];
      this.mutableLength = remainingBuffer.length;
      mutableBlocks.forEach((block) => this.push(block));
      callback(undefined);
    } catch (error) {
      callback(error);
    }
  }

  private processBuffer(
    reader: BinaryReader,
  ): {
    readonly remainingBuffer: Buffer;
    readonly mutableBlocks: Block[];
  } {
    const mutableBlocks: Block[] = [];

    // tslint:disable-next-line no-loop-statement
    while (true) {
      if (reader.remaining < SIZE_OF_INT32) {
        return { remainingBuffer: reader.remainingBuffer, mutableBlocks };
      }

      const length = reader.clone().readInt32LE();

      // Not sure why this doesn't work properly with just length...
      if (reader.remaining < length + SIZE_OF_INT32) {
        return { remainingBuffer: reader.remainingBuffer, mutableBlocks };
      }

      reader.readInt32LE();
      const block = Block.deserializeWireBase({
        context: this.context,
        reader,
      });
      mutableBlocks.push(block);
    }
  }
}
export interface Chain {
  readonly format: 'raw' | 'zip';
  readonly path: string;
}

const getStream = (chain: Chain): Readable => {
  const stream = fs.createReadStream(chain.path);
  if (chain.format === 'zip') {
    return stream.pipe(zlib.createUnzip());
  }

  return stream;
};

const getCount = async (stream: Readable): Promise<number> => {
  let count = stream.read(4);
  // tslint:disable-next-line no-loop-statement
  while (count == undefined) {
    await new Promise<void>((resolve) => setTimeout(resolve, 250));
    count = stream.read(4);
  }

  return count.readUInt32LE(0);
};

export const loadChain = async ({
  blockchain,
  chain,
}: {
  readonly blockchain: Blockchain;
  readonly chain: Chain;
}): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const stream = getStream(chain);
    const transform = new BlockTransform(blockchain.deserializeWireContext);

    const cleanup = () => {
      stream.unpipe(transform);
    };

    let resolved = false;
    let rejected = false;
    const onError = (error: Error) => {
      if (!resolved && !rejected) {
        rejected = true;
        cleanup();
        reject(error);
      }
    };

    const onEnd = () => {
      if (!resolved && !rejected) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    stream.once('error', onError);
    transform.once('finish', onEnd);
    transform.once('end', onEnd);
    transform.once('close', onEnd);
    transform.once('error', onError);

    // Not sure why I can't get this to work with a Writable stream so
    // just implement janky custom backpressure control
    let pending = 0;
    let processed = 0;
    let start = Date.now();
    let paused = false;
    const trackIndex = blockchain.currentBlockIndex;
    transform.on('data', (block: Block) => {
      if (block.index < trackIndex) {
        return;
      }

      pending += 1;
      blockchain
        .persistBlock({ block, unsafe: true })
        .then(() => {
          pending -= 1;
          if (pending < 500 && paused) {
            paused = false;
            transform.resume();
          }

          if (block.index === trackIndex) {
            // tslint:disable-next-line no-console
            console.log(`Loaded chain to current index in ${Date.now() - start} ms`);

            start = Date.now();
          } else if (block.index > trackIndex) {
            processed += 1;
            if (processed >= 100) {
              // tslint:disable-next-line no-console
              console.log(`Processed ${processed} blocks in ${Date.now() - start} ms (${block.index})`);

              processed = 0;
              start = Date.now();
            }
          }
        })
        .catch(onError);
      if (pending > 1000) {
        paused = true;
        transform.pause();
      }
    });

    getCount(stream)
      .then((count) => {
        if (count > blockchain.currentBlockIndex) {
          stream.pipe(transform);
        } else {
          resolved = true;
          // $FlowFixMe
          stream.destroy();
          resolve();
        }
      })
      .catch(reject);
  });

const writeOut = async (blockchain: Blockchain, out: Writable, height: number): Promise<void> => {
  let processed = 0;
  let start = Date.now();
  // tslint:disable-next-line no-loop-statement
  for (const chunk of _.chunk(_.range(0, height), 10000)) {
    // eslint-disable-next-line
    const blocks = await Promise.all(chunk.map(async (index) => blockchain.block.get({ hashOrIndex: index })));

    // tslint:disable-next-line no-loop-statement
    for (const block of blocks) {
      const buffer = block.serializeWire();
      const length = Buffer.alloc(4, 0);
      length.writeInt32LE(buffer.length, 0);
      // tslint:disable-next-line no-unnecessary-callback-wrapper
      await new Promise<void>((resolve) => out.write(length, () => resolve()));
      // tslint:disable-next-line no-unnecessary-callback-wrapper
      await new Promise<void>((resolve) => out.write(buffer, () => resolve()));
      processed += 1;
      if (processed >= 100000) {
        // tslint:disable-next-line no-console
        console.log(`Processed ${processed} blocks in ${Date.now() - start} ms`);

        processed = 0;
        start = Date.now();
      }
    }
  }
  out.end();
};

export const dumpChain = async ({
  blockchain,
  path,
}: {
  readonly blockchain: Blockchain;
  readonly path: string;
}): Promise<void> => {
  const height = blockchain.currentBlockIndex;
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(path);
    out.once('open', () => {
      const count = Buffer.alloc(4, 0);
      count.writeUInt32LE(height, 0);
      out.write(count);

      writeOut(blockchain, out, height).then(resolve, reject);
    });
  });
};
