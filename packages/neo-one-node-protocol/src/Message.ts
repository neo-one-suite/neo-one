import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import {
  BinaryReader,
  Block,
  DeserializeWireBaseOptions,
  DeserializeWireContext,
  DeserializeWireOptions,
  ExtensiblePayload,
  Transaction,
} from '@neo-one/node-core';
import { makeErrorWithCode, utils } from '@neo-one/utils';
import { Transform } from 'stream';
import { assertCommand, Command } from './Command';
import { lz4Helper } from './lz4Helper';
import { assertMessageFlags, MessageFlags } from './MessageFlags';
import {
  AddrPayload,
  FilterAddPayload,
  FilterLoadPayload,
  GetBlockByIndexPayload,
  GetBlocksPayload,
  HeadersPayload,
  InvPayload,
  MerkleBlockPayload,
  PingPayload,
  VersionPayload,
} from './payload';

const tryCompression = ({ command }: MessageValue) =>
  command === Command.Block ||
  command === Command.Extensible ||
  command === Command.Transaction ||
  command === Command.Headers ||
  command === Command.Addr ||
  command === Command.MerkleBlock ||
  command === Command.FilterLoad ||
  command === Command.FilterAdd;

export type MessageValue =
  | { readonly command: Command.Addr; readonly payload: AddrPayload }
  | { readonly command: Command.Block; readonly payload: Block }
  | { readonly command: Command.Extensible; readonly payload: ExtensiblePayload }
  | { readonly command: Command.FilterAdd; readonly payload: FilterAddPayload }
  | { readonly command: Command.FilterClear }
  | { readonly command: Command.FilterLoad; readonly payload: FilterLoadPayload }
  | { readonly command: Command.GetAddr }
  | { readonly command: Command.GetBlocks; readonly payload: GetBlocksPayload }
  | { readonly command: Command.GetBlockByIndex; readonly payload: GetBlockByIndexPayload }
  | { readonly command: Command.GetData; readonly payload: InvPayload }
  | { readonly command: Command.GetHeaders; readonly payload: GetBlockByIndexPayload }
  | { readonly command: Command.Headers; readonly payload: HeadersPayload }
  | { readonly command: Command.Inv; readonly payload: InvPayload }
  | { readonly command: Command.Mempool }
  | { readonly command: Command.Transaction; readonly payload: Transaction }
  | { readonly command: Command.Verack }
  | { readonly command: Command.Version; readonly payload: VersionPayload }
  | { readonly command: Command.Alert }
  | { readonly command: Command.MerkleBlock; readonly payload: MerkleBlockPayload }
  | { readonly command: Command.NotFound; readonly payload: InvPayload }
  | { readonly command: Command.Ping; readonly payload: PingPayload }
  | { readonly command: Command.Pong; readonly payload: PingPayload }
  | { readonly command: Command.Reject };

export interface MessageAdd {
  readonly flags: MessageFlags;
  readonly payloadBuffer: Buffer;
  readonly value: MessageValue;
}

export const PAYLOAD_MAX_SIZE = 0x02000000;
const compressionMinSize = 128;
const compressionThreshold = 64;

export const deserializeMessageValue = (command: Command, options: DeserializeWireOptions): MessageValue => {
  switch (command) {
    case Command.Addr:
      return {
        command: Command.Addr,
        payload: AddrPayload.deserializeWire(options),
      };

    case Command.Block:
      return {
        command: Command.Block,
        payload: Block.deserializeWire(options),
      };

    case Command.Extensible:
      return {
        command: Command.Extensible,
        payload: ExtensiblePayload.deserializeWire(options),
      };

    case Command.FilterAdd:
      return {
        command: Command.FilterAdd,
        payload: FilterAddPayload.deserializeWire(options),
      };

    case Command.FilterClear:
      return { command: Command.FilterClear };

    case Command.FilterLoad:
      return {
        command: Command.FilterLoad,
        payload: FilterLoadPayload.deserializeWire(options),
      };

    case Command.GetAddr:
      return { command: Command.GetAddr };

    case Command.GetBlocks:
      return {
        command: Command.GetBlocks,
        payload: GetBlocksPayload.deserializeWire(options),
      };

    case Command.GetBlockByIndex:
      return {
        command: Command.GetBlockByIndex,
        payload: GetBlockByIndexPayload.deserializeWire(options),
      };

    case Command.GetData:
      return {
        command: Command.GetData,
        payload: InvPayload.deserializeWire(options),
      };

    case Command.GetHeaders:
      return {
        command: Command.GetHeaders,
        payload: GetBlockByIndexPayload.deserializeWire(options),
      };

    case Command.Headers:
      return {
        command: Command.Headers,
        payload: HeadersPayload.deserializeWire(options),
      };

    case Command.Inv:
      return {
        command: Command.Inv,
        payload: InvPayload.deserializeWire(options),
      };

    case Command.Mempool:
      return { command: Command.Mempool };

    case Command.Transaction:
      return {
        command: Command.Transaction,
        payload: Transaction.deserializeWire(options),
      };

    case Command.Verack:
      return { command: Command.Verack };
    case Command.Version:
      return {
        command: Command.Version,
        payload: VersionPayload.deserializeWire(options),
      };

    case Command.Alert:
      return { command: Command.Alert };

    case Command.MerkleBlock:
      return {
        command: Command.MerkleBlock,
        payload: MerkleBlockPayload.deserializeWire(options),
      };

    case Command.NotFound:
      return { command: Command.NotFound, payload: InvPayload.deserializeWire(options) };
    case Command.Ping:
      return { command: Command.Ping, payload: PingPayload.deserializeWire(options) };

    case Command.Pong:
      return { command: Command.Pong, payload: PingPayload.deserializeWire(options) };

    case Command.Reject:
      return { command: Command.Reject };

    default:
      utils.assertNever(command);
      throw new InvalidFormatError(``);
  }
};

export class Message implements SerializableWire {
  public static create(value: MessageValue): Message {
    // tslint:disable-next-line: no-any
    const payloadBuffer = (value as any)?.payload?.serializeWire() ?? Buffer.alloc(0);
    if (tryCompression(value) && payloadBuffer.length > compressionMinSize) {
      const compressed = lz4Helper.compress(payloadBuffer);
      if (compressed.length < payloadBuffer.length - compressionThreshold) {
        return new Message({
          flags: MessageFlags.Compressed,
          value,
          payloadBuffer: compressed,
        });
      }
    }

    return new Message({
      flags: MessageFlags.None,
      payloadBuffer,
      value,
    });
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): Message {
    const { reader, context } = options;

    const flags = assertMessageFlags(reader.readInt8());
    const command = assertCommand(reader.readInt8());
    const payloadBuffer = reader.readVarBytesLE(PAYLOAD_MAX_SIZE);

    const decompressed =
      flags === MessageFlags.Compressed ? lz4Helper.decompress(payloadBuffer, PAYLOAD_MAX_SIZE) : payloadBuffer;

    const payloadOptions = {
      context,
      buffer: decompressed,
    };

    const value = deserializeMessageValue(command, payloadOptions);

    return new this({ flags, value, payloadBuffer });
  }

  public static deserializeWire(options: DeserializeWireOptions): Message {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly flags: MessageFlags;
  public readonly payloadBuffer: Buffer;
  public readonly value: MessageValue;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ flags, payloadBuffer, value }: MessageAdd) {
    this.flags = flags;
    this.payloadBuffer = payloadBuffer;
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.flags);
    writer.writeUInt8(this.value.command);
    writer.writeVarBytesLE(this.payloadBuffer);
  }
}

export const InvalidMessageTransformEncodingError = makeErrorWithCode(
  'INVALID_MESSAGE_TRANSFORM_ENCODING',
  (message: string) => message,
);

const SIZE_OF_MESSAGE_HEADER = 3;

const deserializeMessageHeader = (data: Buffer) => {
  const header = data.slice(0, 3);
  const flags = assertMessageFlags(header[0]);
  const command = assertCommand(header[1]);
  const length = header[2];

  return { length, flags, command };
};

export class MessageTransform extends Transform {
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
    callback: (error: Error | undefined, data?: Buffer | string) => void,
  ): void {
    if (typeof chunk === 'string') {
      throw new InvalidMessageTransformEncodingError(
        `Invalid Message Transform Chunk Type. Expected chunk type to be 'string', found: ${typeof chunk}`,
      );
    }
    if (encoding !== 'buffer') {
      throw new InvalidMessageTransformEncodingError(
        `Invalid Message Transform Encoding. Expected: 'buffer', found: ${encoding}`,
      );
    }

    this.mutableBuffer = Buffer.concat([this.mutableBuffer, chunk]);
    try {
      const { remainingBuffer, mutableMessages } = this.processBuffer(new BinaryReader(this.mutableBuffer));

      this.mutableBuffer = remainingBuffer;
      mutableMessages.forEach((message) => this.push(message));
      callback(undefined);
    } catch (error) {
      callback(error);
    }
  }

  private processBuffer(reader: BinaryReader): {
    readonly remainingBuffer: Buffer;
    readonly mutableMessages: Message[];
  } {
    if (reader.remaining < SIZE_OF_MESSAGE_HEADER) {
      return { remainingBuffer: reader.remainingBuffer, mutableMessages: [] };
    }

    const { length } = deserializeMessageHeader(reader.clone().remainingBuffer);

    if (reader.remaining < SIZE_OF_MESSAGE_HEADER + length) {
      return { remainingBuffer: reader.remainingBuffer, mutableMessages: [] };
    }

    const message = Message.deserializeWireBase({
      context: this.context,
      reader,
    });

    const { remainingBuffer, mutableMessages } = this.processBuffer(reader);
    mutableMessages.push(message);

    return { remainingBuffer, mutableMessages };
  }
}
