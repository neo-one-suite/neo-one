/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type DeserializeWireContext,
  type SerializeWire,
  type SerializableWire,
  type Transaction,
  BinaryReader,
  Block,
  ConsensusPayload,
  IOHelper,
  InvalidFormatError,
  common,
  createSerializeWire,
  crypto,
  deserializeTransactionWire,
} from '@neo-one/client-core';
import { CustomError } from '@neo-one/utils';
import { Transform } from 'stream';

import {
  AddrPayload,
  FilterAddPayload,
  FilterLoadPayload,
  GetBlocksPayload,
  HeadersPayload,
  InvPayload,
  VersionPayload,
  MerkleBlockPayload,
} from './payload';
import { COMMAND, type Command, assertCommand } from './Command';

export type MessageValue =
  | {| command: 'addr', payload: AddrPayload |}
  | {| command: 'block', payload: Block |}
  | {| command: 'consensus', payload: ConsensusPayload |}
  | {| command: 'filteradd', payload: FilterAddPayload |}
  | {| command: 'filterclear' |}
  | {| command: 'filterload', payload: FilterLoadPayload |}
  | {| command: 'getaddr' |}
  | {| command: 'getblocks', payload: GetBlocksPayload |}
  | {| command: 'getdata', payload: InvPayload |}
  | {| command: 'getheaders', payload: GetBlocksPayload |}
  | {| command: 'headers', payload: HeadersPayload |}
  | {| command: 'inv', payload: InvPayload |}
  | {| command: 'mempool' |}
  | {| command: 'tx', payload: Transaction |}
  | {| command: 'verack' |}
  | {| command: 'version', payload: VersionPayload |}
  | {| command: 'alert' |}
  | {| command: 'merkleblock', payload: MerkleBlockPayload |}
  | {| command: 'notfound' |}
  | {| command: 'ping' |}
  | {| command: 'pong' |}
  | {| command: 'reject' |};

export type MessageAdd = {|
  magic: number,
  value: MessageValue,
|};

export const COMMAND_LENGTH = 12;
export const PAYLOAD_MAX_SIZE = 0x02000000;

const calculateChecksum = (buffer: Buffer) =>
  common.toUInt32LE(crypto.hash256(buffer));

const deserializeMessageHeader = ({
  context,
  reader,
}: DeserializeWireBaseOptions): {
  command: Command,
  length: number,
  checksum: number,
} => {
  if (reader.readUInt32LE() !== context.messageMagic) {
    throw new InvalidFormatError();
  }
  const command = assertCommand(reader.readFixedString(COMMAND_LENGTH));
  const length = reader.readUInt32LE();
  if (length > PAYLOAD_MAX_SIZE) {
    throw new InvalidFormatError();
  }
  const checksum = reader.readUInt32LE();

  return { command, length, checksum };
};

export default class Message implements SerializableWire<Message> {
  magic: number;
  value: MessageValue;

  constructor({ magic, value }: MessageAdd) {
    this.magic = magic;
    this.value = value;
  }

  serializeWireBase(writer: BinaryWriter): void {
    const { value } = this;

    writer.writeUInt32LE(this.magic);
    writer.writeFixedString(value.command, COMMAND_LENGTH);

    let payload = Buffer.alloc(0);
    switch (value.command) {
      case 'addr':
        payload = value.payload.serializeWire();
        break;
      case 'block':
        payload = value.payload.serializeWire();
        break;
      case 'consensus':
        payload = value.payload.serializeWire();
        break;
      case 'filteradd':
        payload = value.payload.serializeWire();
        break;
      case 'filterclear':
        break;
      case 'filterload':
        payload = value.payload.serializeWire();
        break;
      case 'getaddr':
        break;
      case 'getblocks':
        payload = value.payload.serializeWire();
        break;
      case 'getdata':
        payload = value.payload.serializeWire();
        break;
      case 'getheaders':
        payload = value.payload.serializeWire();
        break;
      case 'headers':
        payload = value.payload.serializeWire();
        break;
      case 'inv':
        payload = value.payload.serializeWire();
        break;
      case 'mempool':
        break;
      case 'tx':
        payload = value.payload.serializeWire();
        break;
      case 'verack':
        break;
      case 'version':
        payload = value.payload.serializeWire();
        break;
      case 'alert':
        break;
      case 'merkleblock':
        payload = value.payload.serializeWire();
        break;
      case 'notfound':
        break;
      case 'ping':
        break;
      case 'pong':
        break;
      case 'reject':
        break;
      default:
        // eslint-disable-next-line
        (value.command: empty);
        throw new InvalidFormatError();
    }

    writer.writeUInt32LE(payload.length);
    writer.writeUInt32LE(calculateChecksum(payload));
    writer.writeBytes(payload);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(options: DeserializeWireBaseOptions): Message {
    const { reader, context } = options;
    const { command, length, checksum } = deserializeMessageHeader(options);
    const payloadBuffer = reader.readBytes(length);
    if (calculateChecksum(payloadBuffer) !== checksum) {
      throw new InvalidFormatError();
    }

    const payloadOptions = {
      context: options.context,
      buffer: payloadBuffer,
    };

    let value;
    switch (command) {
      case 'addr':
        value = {
          command: COMMAND.ADDR,
          payload: AddrPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'block':
        value = {
          command: COMMAND.BLOCK,
          payload: Block.deserializeWire(payloadOptions),
        };
        break;
      case 'consensus':
        value = {
          command: COMMAND.CONSENSUS,
          payload: ConsensusPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'filteradd':
        value = {
          command: COMMAND.FILTER_ADD,
          payload: FilterAddPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'filterclear':
        value = { command: COMMAND.FILTER_CLEAR };
        break;
      case 'filterload':
        value = {
          command: COMMAND.FILTER_LOAD,
          payload: FilterLoadPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'getaddr':
        value = { command: COMMAND.GET_ADDR };
        break;
      case 'getblocks':
        value = {
          command: COMMAND.GET_BLOCKS,
          payload: GetBlocksPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'getdata':
        value = {
          command: COMMAND.GET_DATA,
          payload: InvPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'getheaders':
        value = {
          command: COMMAND.GET_HEADERS,
          payload: GetBlocksPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'headers':
        value = {
          command: COMMAND.HEADERS,
          payload: HeadersPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'inv':
        value = {
          command: COMMAND.INV,
          payload: InvPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'mempool':
        value = { command: COMMAND.MEMPOOL };
        break;
      case 'tx':
        value = {
          command: COMMAND.TX,
          payload: deserializeTransactionWire(payloadOptions),
        };
        break;
      case 'verack':
        value = { command: COMMAND.VERACK };
        break;
      case 'version':
        value = {
          command: COMMAND.VERSION,
          payload: VersionPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'alert':
        value = { command: COMMAND.ALERT };
        break;
      case 'merkleblock':
        value = {
          command: COMMAND.MERKLE_BLOCK,
          payload: MerkleBlockPayload.deserializeWire(payloadOptions),
        };
        break;
      case 'notfound':
        value = { command: COMMAND.NOT_FOUND };
        break;
      case 'ping':
        value = { command: COMMAND.PING };
        break;
      case 'pong':
        value = { command: COMMAND.PONG };
        break;
      case 'reject':
        value = { command: COMMAND.REJECT };
        break;
      default:
        // eslint-disable-next-line
        (command: empty);
        throw new InvalidFormatError();
    }

    return new this({ magic: context.messageMagic, value });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}

export class InvalidMessageTransformEncodingError extends CustomError {
  code: string;
  constructor() {
    super('Invalid Message Transform Encoding.');
    this.code = 'INVALID_MESSAGE_TRANSFORM_ENCODING';
  }
}

const SIZE_OF_MESSAGE_HEADER =
  IOHelper.sizeOfUInt32LE +
  IOHelper.sizeOfFixedString(COMMAND_LENGTH) +
  IOHelper.sizeOfUInt32LE +
  IOHelper.sizeOfUInt32LE;

export class MessageTransform extends Transform {
  context: DeserializeWireContext;
  buffer: Buffer;

  constructor(context: DeserializeWireContext) {
    super({ readableObjectMode: true });
    this.context = context;
    this.buffer = Buffer.from([]);
  }

  _transform(
    chunk: Buffer | string,
    encoding: string,
    callback: (error: ?Error, data?: Buffer | string) => void,
  ): void {
    if (typeof chunk === 'string' || encoding !== 'buffer') {
      throw new InvalidMessageTransformEncodingError();
    }

    this.buffer = Buffer.concat([this.buffer, chunk]);
    try {
      const { remainingBuffer, messages } = this._processBuffer(
        new BinaryReader(this.buffer),
      );
      this.buffer = remainingBuffer;
      messages.forEach(message => this.push((message: $FlowFixMe)));
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  _processBuffer(
    reader: BinaryReader,
  ): {|
    remainingBuffer: Buffer,
    messages: Array<Message>,
  |} {
    if (reader.remaining < SIZE_OF_MESSAGE_HEADER) {
      return { remainingBuffer: reader.remainingBuffer, messages: [] };
    }

    const { length } = deserializeMessageHeader({
      context: this.context,
      reader: reader.clone(),
    });

    if (reader.remaining < SIZE_OF_MESSAGE_HEADER + length) {
      return { remainingBuffer: reader.remainingBuffer, messages: [] };
    }

    const message = Message.deserializeWireBase({
      context: this.context,
      reader,
    });
    const { remainingBuffer, messages } = this._processBuffer(reader);
    messages.push(message);
    return { remainingBuffer, messages };
  }
}
