/* @flow */
import type BN from 'bn.js';

import {
  type StateDescriptorType,
  assertStateDescriptorType,
} from './StateDescriptorType';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableJSON,
  type SerializeJSONContext,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../../Serializable';
import type { FeeContext, TransactionVerifyOptions } from '../TransactionBase';
import { InvalidFormatError, VerifyError } from '../../errors';

import common, { type UInt160Hex } from '../../common';
import crypto from '../../crypto';
import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from '../../utils';

export type StateDescriptorAdd = {|
  type: StateDescriptorType,
  key: Buffer,
  field: string,
  value: Buffer,
|};

export type StateDescriptorTypeJSON = 'Account' | 'Validator';

export type StateDescriptorJSON = {|
  type: 'Account' | 'Validator',
  key: string,
  field: string,
  value: string,
|};

const VOTES = 'Votes';
const REGISTERED = 'Registered';

export default class StateDescriptor
  implements
    SerializableWire<StateDescriptor>,
    SerializableJSON<StateDescriptorJSON> {
  type: StateDescriptorType;
  key: Buffer;
  field: string;
  value: Buffer;

  constructor({ type, key, field, value }: StateDescriptorAdd) {
    this.type = type;
    this.key = key;
    this.field = field;
    this.value = value;
  }

  __size = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfVarBytesLE(this.key) +
      IOHelper.sizeOfVarString(this.field) +
      IOHelper.sizeOfVarBytesLE(this.value),
  );

  get size(): number {
    return this.__size();
  }

  getSystemFee(context: FeeContext): BN {
    const { type } = this;
    switch (type) {
      case 0x40:
        return utils.ZERO;
      case 0x48:
        if (this.value.some(byte => byte !== 0)) {
          return context.registerValidatorFee;
        }

        return utils.ZERO;
      default:
        // eslint-disable-next-line
        (type: empty);
        throw new Error('For Flow');
    }
  }

  getScriptHashesForVerifying(): Array<UInt160Hex> {
    const { type } = this;
    switch (type) {
      case 0x40:
        return [common.uInt160ToHex(common.bufferToUInt160(this.key))];
      case 0x48:
        return [
          common.uInt160ToHex(
            crypto.getVerificationScriptHash(common.bufferToECPoint(this.key)),
          ),
        ];
      default:
        // eslint-disable-next-line
        (type: empty);
        throw new Error('For Flow');
    }
  }

  verify(options: TransactionVerifyOptions): Promise<void> {
    const { type } = this;
    switch (type) {
      case 0x40:
        return this._verifyAccount(options);
      case 0x48:
        return this._verifyValidator();
      default:
        // eslint-disable-next-line
        (type: empty);
        throw new Error('For Flow');
    }
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeVarBytesLE(this.key);
    writer.writeVarString(this.field);
    writer.writeVarBytesLE(this.value);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): StateDescriptor {
    const { reader } = options;
    const type = assertStateDescriptorType(reader.readUInt8());
    const key = reader.readVarBytesLE(100);
    const field = reader.readVarString(32);
    const value = reader.readVarBytesLE(65535);

    switch (type) {
      case 0x40:
        if (key.length !== 20) {
          throw new InvalidFormatError();
        }
        if (field !== VOTES) {
          throw new InvalidFormatError();
        }
        break;
      case 0x48:
        if (key.length !== 33) {
          throw new InvalidFormatError();
        }
        if (field !== REGISTERED) {
          throw new InvalidFormatError();
        }
        break;
      default:
        // eslint-disable-next-line
        (type: empty);
        throw new Error('For Flow');
    }

    return new this({
      type,
      key,
      field,
      value,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): StateDescriptorJSON {
    return {
      type: this._getJSONType(),
      key: JSONHelper.writeBuffer(this.key),
      field: this.field,
      value: JSONHelper.writeBuffer(this.value),
    };
  }

  _getJSONType(): StateDescriptorTypeJSON {
    const { type } = this;
    switch (type) {
      case 0x40:
        return 'Account';
      case 0x48:
        return 'Validator';
      default:
        // eslint-disable-next-line
        (type: empty);
        throw new Error('For Flow');
    }
  }

  async _verifyAccount(options: TransactionVerifyOptions): Promise<void> {
    if (this.field !== VOTES) {
      throw new VerifyError(`Invalid field ${this.field}`);
    }

    const reader = new BinaryReader(this.value);
    const hash = common.bufferToUInt160(this.key);
    const [account, validators] = await Promise.all([
      options.tryGetAccount({ hash }),
      options.getAllValidators(),
    ]);
    if (account == null || account.isFrozen) {
      throw new VerifyError('Account is frozen');
    }

    const publicKeys = reader.readArray(() => reader.readECPoint());
    if (publicKeys.length > 0) {
      if (account.getBalance(options.governingToken.hashHex).eq(utils.ZERO)) {
        throw new VerifyError('Account does not have NEO');
      }

      const validatorPublicKeysSet = new Set(
        validators
          .filter(validator => validator.registered)
          .map(validator => validator.publicKey)
          .concat(options.standbyValidators)
          .map(key => common.ecPointToHex(key)),
      );

      for (const publicKey of publicKeys) {
        if (!validatorPublicKeysSet.has(common.ecPointToHex(publicKey))) {
          throw new VerifyError('Invalid validator public key');
        }
      }
    }
  }

  async _verifyValidator(): Promise<void> {
    if (this.field !== REGISTERED) {
      throw new VerifyError(`Invalid field ${this.field}`);
    }
  }
}
