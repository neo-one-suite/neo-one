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
  deserializeTransactionWire,
  DeserializeWireBaseOptions,
  DeserializeWireContext,
  DeserializeWireOptions,
  Transaction,
} from '@neo-one/node-core';
import { makeErrorWithCode, utils } from '@neo-one/utils';
import { Transform } from 'stream';
import { assertCommand, Command } from './Command';
import {
  AddrPayload,
  FilterAddPayload,
  FilterLoadPayload,
  GetBlocksPayload,
  HeadersPayload,
  InvPayload,
  MerkleBlockPayload,
  VersionPayload,
} from './payload';
export type MessageValue =
  | { readonly command: Command.addr; readonly payload: AddrPayload }
  | { readonly command: Command.block; readonly payload: Block }
  | { readonly command: Command.consensus; readonly payload: ConsensusPayload }
  | { readonly command: Command.filteradd; readonly payload: FilterAddPayload }
  | { readonly command: Command.filterclear }
  | { readonly command: Command.filterload; readonly payload: FilterLoadPayload }
  | { readonly command: Command.getaddr }
  | { readonly command: Command.getblocks; readonly payload: GetBlocksPayload }
  | { readonly command: Command.getdata; readonly payload: InvPayload }
  | { readonly command: Command.getheaders; readonly payload: GetBlocksPayload }
  | { readonly command: Command.headers; readonly payload: HeadersPayload }
  | { readonly command: Command.inv; readonly payload: InvPayload }
  | { readonly command: Command.mempool }
  | { readonly command: Command.tx; readonly payload: Transaction }
  | { readonly command: Command.verack }
  | { readonly command: Command.version; readonly payload: VersionPayload }
  | { readonly command: Command.alert }
  | { readonly command: Command.merkleblock; readonly payload: MerkleBlockPayload }
  | { readonly command: Command.notfound }
  | { readonly command: Command.ping }
  | { readonly command: Command.pong }
  | { readonly command: Command.reject };
export interface MessageAdd {
  readonly magic: number;
  readonly value: MessageValue;
}

export const COMMAND_LENGTH = 12;
export const PAYLOAD_MAX_SIZE = 0x02000000;

const calculateChecksum = (buffer: Buffer) => common.toUInt32LE(crypto.hash256(buffer));

const deserializeMessageHeader = ({
  context,
  reader,
}: DeserializeWireBaseOptions): {
  readonly command: Command;
  readonly length: number;
  readonly checksum: number;
} => {
  if (reader.readUInt32LE() !== context.messageMagic) {
    throw new InvalidFormatError(
      `Expected BinaryReader readUInt32LE(0) to equal ${context.messageMagic}. Received: ${context.messageMagic}`,
    );
  }
  const command = assertCommand(reader.readFixedString(COMMAND_LENGTH));
  const length = reader.readUInt32LE();
  if (length > PAYLOAD_MAX_SIZE) {
    throw new InvalidFormatError(
      `Expected buffer readout to be less than max payload size of ${PAYLOAD_MAX_SIZE}. Received: ${length}`,
    );
  }
  const checksum = reader.readUInt32LE();

  return { command, length, checksum };
};

export class Message implements SerializableWire<Message> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Message {
    const { reader, context } = options;
    const { command, length, checksum } = deserializeMessageHeader(options);
    const payloadBuffer = reader.readBytes(length);
    const payloadBufferChecksum = calculateChecksum(payloadBuffer);
    if (payloadBufferChecksum !== checksum) {
      throw new InvalidFormatError(
        `Expected payloadBuffer checksum to be ${checksum}. Received: ${payloadBufferChecksum}`,
      );
    }

    const payloadOptions = {
      context: options.context,
      buffer: payloadBuffer,
    };

    let value: MessageValue;
    switch (command) {
      case Command.addr:
        value = {
          command: Command.addr,
          payload: AddrPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.block:
        value = {
          command: Command.block,
          payload: Block.deserializeWire(payloadOptions),
        };

        break;
      case Command.consensus:
        value = {
          command: Command.consensus,
          payload: ConsensusPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.filteradd:
        value = {
          command: Command.filteradd,
          payload: FilterAddPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.filterclear:
        value = { command: Command.filterclear };
        break;
      case Command.filterload:
        value = {
          command: Command.filterload,
          payload: FilterLoadPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.getaddr:
        value = { command: Command.getaddr };
        break;
      case Command.getblocks:
        value = {
          command: Command.getblocks,
          payload: GetBlocksPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.getdata:
        value = {
          command: Command.getdata,
          payload: InvPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.getheaders:
        value = {
          command: Command.getheaders,
          payload: GetBlocksPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.headers:
        value = {
          command: Command.headers,
          payload: HeadersPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.inv:
        value = {
          command: Command.inv,
          payload: InvPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.mempool:
        value = { command: Command.mempool };
        break;
      case Command.tx:
        value = {
          command: Command.tx,
          payload: deserializeTransactionWire(payloadOptions),
        };

        break;
      case Command.verack:
        value = { command: Command.verack };
        break;
      case Command.version:
        value = {
          command: Command.version,
          payload: VersionPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.alert:
        value = { command: Command.alert };
        break;
      case Command.merkleblock:
        value = {
          command: Command.merkleblock,
          payload: MerkleBlockPayload.deserializeWire(payloadOptions),
        };

        break;
      case Command.notfound:
        value = { command: Command.notfound };
        break;
      case Command.ping:
        value = { command: Command.ping };
        break;
      case Command.pong:
        value = { command: Command.pong };
        break;
      case Command.reject:
        value = { command: Command.reject };
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
      case Command.addr:
        payload = value.payload.serializeWire();
        break;
      case Command.block:
        payload = value.payload.serializeWire();
        break;
      case Command.consensus:
        payload = value.payload.serializeWire();
        break;
      case Command.filteradd:
        payload = value.payload.serializeWire();
        break;
      case Command.filterclear:
        break;
      case Command.filterload:
        payload = value.payload.serializeWire();
        break;
      case Command.getaddr:
        break;
      case Command.getblocks:
        payload = value.payload.serializeWire();
        break;
      case Command.getdata:
        payload = value.payload.serializeWire();
        break;
      case Command.getheaders:
        payload = value.payload.serializeWire();
        break;
      case Command.headers:
        payload = value.payload.serializeWire();
        break;
      case Command.inv:
        payload = value.payload.serializeWire();
        break;
      case Command.mempool:
        break;
      case Command.tx:
        payload = value.payload.serializeWire();
        break;
      case Command.verack:
        break;
      case Command.version:
        payload = value.payload.serializeWire();
        break;
      case Command.alert:
        break;
      case Command.merkleblock:
        payload = value.payload.serializeWire();
        break;
      case Command.notfound:
        break;
      case Command.ping:
        break;
      case Command.pong:
        break;
      case Command.reject:
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
