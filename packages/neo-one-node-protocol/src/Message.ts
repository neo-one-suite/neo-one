import {
  BinaryWriter,
  common,
  createSerializeWire,
  crypto,
  InvalidFormatError,
  IOHelper,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import {
  BinaryReader,
  Block,
  ConsensusPayload,
  DeserializeWireBaseOptions,
  DeserializeWireContext,
  DeserializeWireOptions,
  Transaction,
} from '@neo-one/node-core';
import { makeErrorWithCode, utils } from '@neo-one/utils';
import { Transform } from 'stream';
import { assertCommand, Command } from './Command';
import { assertMessageFlags } from './MessageFlags';
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
export type MessageValue =
  | { readonly command: Command.Addr; readonly payload: AddrPayload }
  | { readonly command: Command.Block; readonly payload: Block }
  | { readonly command: Command.Consensus; readonly payload: ConsensusPayload }
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
  readonly magic: number;
  readonly value: MessageValue;
}

export const PAYLOAD_MAX_SIZE = 0x02000000;
const compressionMinSize = 128;
const compressionThreshold = 64;

const calculateChecksum = (buffer: Buffer) => common.toUInt32LE(crypto.hash256(buffer));

export class Message implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Message {
    const { reader, context } = options;

    const flags = assertMessageFlags(reader.readInt8());
    const command = assertCommand(reader.readInt8());
    const payloadBuffer = reader.readVarBytesLE(PAYLOAD_MAX_SIZE);

    // TODO: pickup here, we need to work out compressing / decompressing the message payload
    // and how that will be stored in the class;

    const payloadOptions = {
      context: options.context,
      buffer: payloadBuffer,
    };

    let value: MessageValue;
    switch (command) {
      case Command.Addr:
        value = {
          command: Command.Addr,
          payload: AddrPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.Block:
        value = {
          command: Command.Block,
          payload: Block.deserializeWire(payloadOptions),
        };

        break;
      case Command.Consensus:
        value = {
          command: Command.Consensus,
          payload: ConsensusPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.FilterAdd:
        value = {
          command: Command.FilterAdd,
          payload: FilterAddPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.FilterClear:
        value = { command: Command.FilterClear };

        break;
      case Command.FilterLoad:
        value = {
          command: Command.FilterLoad,
          payload: FilterLoadPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.GetAddr:
        value = { command: Command.GetAddr };

        break;
      case Command.GetBlocks:
        value = {
          command: Command.GetBlocks,
          payload: GetBlocksPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.GetBlockByIndex:
        value = {
          command: Command.GetBlockByIndex,
          payload: GetBlockByIndexPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.GetData:
        value = {
          command: Command.GetData,
          payload: InvPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.GetHeaders:
        value = {
          command: Command.GetHeaders,
          payload: GetBlockByIndexPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.Headers:
        value = {
          command: Command.Headers,
          payload: HeadersPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.Inv:
        value = {
          command: Command.Inv,
          payload: InvPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.Mempool:
        value = { command: Command.Mempool };

        break;
      case Command.Transaction:
        value = {
          command: Command.Transaction,
          payload: Transaction.deserializeWire(payloadOptions),
        };

        break;
      case Command.Verack:
        value = { command: Command.Verack };
        break;
      case Command.Version:
        value = {
          command: Command.Version,
          payload: VersionPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.Alert:
        value = { command: Command.Alert };

        break;
      case Command.MerkleBlock:
        value = {
          command: Command.MerkleBlock,
          payload: MerkleBlockPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.NotFound:
        value = { command: Command.NotFound, payload: InvPayload.deserializeWire(payloadOptions) };
        break;
      case Command.Ping:
        value = { command: Command.Ping, payload: PingPayload.deserializeWire(payloadOptions) };

        break;
      case Command.Pong:
        value = { command: Command.Pong, payload: PingPayload.deserializeWire(payloadOptions) };

        break;
      case Command.Reject:
        value = { command: Command.Reject };

        break;
      default:
        utils.assertNever(command);
        throw new InvalidFormatError(``);
    }

    return new this({ magic: context.messageMagic, value });
  }

  public static deserializeWire(options: DeserializeWireOptions): Message {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly magic: number;
  public readonly value: MessageValue;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ magic, value }: MessageAdd) {
    this.magic = magic;
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    const { value } = this;

    writer.writeUInt32LE(this.magic);
    writer.writeFixedString(value.command, COMMAND_LENGTH);

    let payload = Buffer.alloc(0);
    switch (value.command) {
      case Command.Addr:
        payload = value.payload.serializeWire();
        break;
      case Command.Block:
        payload = value.payload.serializeWire();
        break;
      case Command.Consensus:
        payload = value.payload.serializeWire();
        break;
      case Command.FilterAdd:
        payload = value.payload.serializeWire();
        break;
      case Command.FilterClear:
        break;
      case Command.FilterLoad:
        payload = value.payload.serializeWire();
        break;
      case Command.GetAddr:
        break;
      case Command.GetBlocks:
        payload = value.payload.serializeWire();
        break;
      case Command.GetData:
        payload = value.payload.serializeWire();
        break;
      case Command.GetHeaders:
        payload = value.payload.serializeWire();
        break;
      case Command.Headers:
        payload = value.payload.serializeWire();
        break;
      case Command.Inv:
        payload = value.payload.serializeWire();
        break;
      case Command.Mempool:
        break;
      case Command.Transaction:
        payload = value.payload.serializeWire();
        break;
      case Command.Verack:
        break;
      case Command.Version:
        payload = value.payload.serializeWire();
        break;
      case Command.Alert:
        break;
      case Command.MerkleBlock:
        payload = value.payload.serializeWire();
        break;
      case Command.NotFound:
        break;
      case Command.Ping:
        break;
      case Command.Pong:
        break;
      case Command.Reject:
        break;
      default:
        utils.assertNever(value);
        throw new InvalidFormatError('Command does not exist');
    }

    writer.writeUInt32LE(payload.length);
    writer.writeUInt32LE(calculateChecksum(payload));
    writer.writeBytes(payload);
  }
}

export const InvalidMessageTransformEncodingError = makeErrorWithCode(
  'INVALID_MESSAGE_TRANSFORM_ENCODING',
  (message: string) => message,
);

const SIZE_OF_MESSAGE_HEADER =
  IOHelper.sizeOfUInt32LE +
  IOHelper.sizeOfFixedString(COMMAND_LENGTH) +
  IOHelper.sizeOfUInt32LE +
  IOHelper.sizeOfUInt32LE;

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

  private processBuffer(
    reader: BinaryReader,
  ): {
    readonly remainingBuffer: Buffer;
    readonly mutableMessages: Message[];
  } {
    if (reader.remaining < SIZE_OF_MESSAGE_HEADER) {
      return { remainingBuffer: reader.remainingBuffer, mutableMessages: [] };
    }

    const { length } = deserializeMessageHeader({
      context: this.context,
      reader: reader.clone(),
    });

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
