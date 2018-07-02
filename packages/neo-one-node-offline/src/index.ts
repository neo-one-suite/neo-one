import { BinaryReader, Block, DeserializeWireContext } from '@neo-one/client-core';
import { Blockchain } from '@neo-one/node-core';
import { CustomError } from '@neo-one/utils';
import * as fs from 'fs';
import * as _ from 'lodash';
import { Readable, Transform, Writable } from 'stream';
import * as zlib from 'zlib';

export class InvalidBlockTransformEncodingError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Invalid Block Transform Encoding.');
    this.code = 'INVALID_BLOCK_TRANSFORM_ENCODING';
  }
}

const SIZE_OF_INT32 = 4;

class BlockTransform extends Transform {
  public readonly context: DeserializeWireContext;
  public mutableBuffer: Buffer;

  public constructor(context: DeserializeWireContext) {
    super({ readableObjectMode: true });
    this.context = context;
    this.mutableBuffer = Buffer.from([]);
  }

  public _transform(
    chunk: Buffer | string,
    encoding: string,
    callback: ((error: Error | undefined, data?: Buffer | string) => void),
  ): void {
    if (typeof chunk === 'string' || encoding !== 'buffer') {
      throw new InvalidBlockTransformEncodingError();
    }

    this.mutableBuffer = Buffer.concat([this.mutableBuffer, chunk]);
    try {
      const { remainingBuffer, mutableBlocks } = this.processBuffer(new BinaryReader(this.mutableBuffer));

      this.mutableBuffer = remainingBuffer;
      mutableBlocks.reverse();
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
    if (reader.remaining < SIZE_OF_INT32) {
      return { remainingBuffer: reader.remainingBuffer, mutableBlocks: [] };
    }

    const length = reader.clone().readInt32LE();

    // Not sure why this doesn't work properly with just length...
    if (reader.remaining + SIZE_OF_INT32 < length * 2) {
      return { remainingBuffer: reader.remainingBuffer, mutableBlocks: [] };
    }

    reader.readInt32LE();
    const block = Block.deserializeWireBase({
      context: this.context,
      reader,
    });

    const { remainingBuffer, mutableBlocks } = this.processBuffer(reader);
    mutableBlocks.push(block);

    return { remainingBuffer, mutableBlocks };
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
      await new Promise<void>((resolve) => out.write(length, resolve));
      await new Promise<void>((resolve) => out.write(buffer, resolve));
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
