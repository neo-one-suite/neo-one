import { utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import { common, UInt160Hex } from '../../common';
import { crypto } from '../../crypto';
import { InvalidFormatError, VerifyError } from '../../errors';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../../Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from '../../utils';
import { FeeContext, TransactionVerifyOptions } from '../TransactionBase';
import { assertStateDescriptorType, StateDescriptorType } from './StateDescriptorType';

export interface StateDescriptorAdd {
  readonly type: StateDescriptorType;
  readonly key: Buffer;
  readonly field: string;
  readonly value: Buffer;
}

export type StateDescriptorTypeJSON = keyof typeof StateDescriptorType;

export interface StateDescriptorJSON {
  readonly type: StateDescriptorTypeJSON;
  readonly key: string;
  readonly field: string;
  readonly value: string;
}

const VOTES = 'Votes';
const REGISTERED = 'Registered';

export class StateDescriptor implements SerializableWire<StateDescriptor>, SerializableJSON<StateDescriptorJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StateDescriptor {
    const { reader } = options;
    const type = assertStateDescriptorType(reader.readUInt8());
    const key = reader.readVarBytesLE(100);
    const field = reader.readVarString(32);
    const value = reader.readVarBytesLE(65535);

    switch (type) {
      case StateDescriptorType.Account:
        if (key.length !== 20) {
          throw new InvalidFormatError();
        }
        if (field !== VOTES) {
          throw new InvalidFormatError();
        }
        break;
      case StateDescriptorType.Validator:
        if (key.length !== 33) {
          throw new InvalidFormatError();
        }
        if (field !== REGISTERED) {
          throw new InvalidFormatError();
        }
        break;
      default:
        commonUtils.assertNever(type);
    }

    return new this({
      type,
      key,
      field,
      value,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): StateDescriptor {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: StateDescriptorType;
  public readonly key: Buffer;
  public readonly field: string;
  public readonly value: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfVarBytesLE(this.key) +
      IOHelper.sizeOfVarString(this.field) +
      IOHelper.sizeOfVarBytesLE(this.value),
  );

  public constructor({ type, key, field, value }: StateDescriptorAdd) {
    this.type = type;
    this.key = key;
    this.field = field;
    this.value = value;
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public getSystemFee(context: FeeContext): BN {
    const { type } = this;
    switch (type) {
      case StateDescriptorType.Account:
        return utils.ZERO;
      case StateDescriptorType.Validator:
        if (this.value.some((byte) => byte !== 0)) {
          return context.registerValidatorFee;
        }

        return utils.ZERO;
      default:
        commonUtils.assertNever(type);
        throw new Error('For TS');
    }
  }

  public getScriptHashesForVerifying(): ReadonlyArray<UInt160Hex> {
    const { type } = this;
    switch (type) {
      case StateDescriptorType.Account:
        return [common.uInt160ToHex(common.bufferToUInt160(this.key))];
      case StateDescriptorType.Validator:
        return [common.uInt160ToHex(crypto.getVerificationScriptHash(common.bufferToECPoint(this.key)))];
      default:
        commonUtils.assertNever(type);
        throw new Error('For TS');
    }
  }

  public async verify(options: TransactionVerifyOptions): Promise<void> {
    const { type } = this;
    switch (type) {
      case StateDescriptorType.Account:
        return this.verifyAccount(options);
      case StateDescriptorType.Validator:
        return this.verifyValidator();
      default:
        commonUtils.assertNever(type);
        throw new Error('For TS');
    }
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeVarBytesLE(this.key);
    writer.writeVarString(this.field);
    writer.writeVarBytesLE(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): StateDescriptorJSON {
    return {
      type: this.getJSONType(),
      key: JSONHelper.writeBuffer(this.key),
      field: this.field,
      value: JSONHelper.writeBuffer(this.value),
    };
  }

  private getJSONType(): StateDescriptorTypeJSON {
    return StateDescriptorType[this.type] as StateDescriptorTypeJSON;
  }

  private async verifyAccount(options: TransactionVerifyOptions): Promise<void> {
    if (this.field !== VOTES) {
      throw new VerifyError(`Invalid field ${this.field}`);
    }

    const reader = new BinaryReader(this.value);
    const hash = common.bufferToUInt160(this.key);
    const [account, validators] = await Promise.all([options.tryGetAccount({ hash }), options.getAllValidators()]);

    if (account === undefined || account.isFrozen) {
      throw new VerifyError('Account is frozen');
    }

    const publicKeys = reader.readArray(() => reader.readECPoint());
    if (publicKeys.length > 0) {
      if (account.getBalance(options.governingToken.hashHex).eq(utils.ZERO)) {
        throw new VerifyError('Account does not have NEO');
      }

      const validatorPublicKeysSet = new Set(
        validators
          .filter((validator) => validator.registered)
          .map((validator) => validator.publicKey)
          .concat(options.standbyValidators)
          .map((key) => common.ecPointToHex(key)),
      );

      publicKeys.forEach((publicKey) => {
        if (!validatorPublicKeysSet.has(common.ecPointToHex(publicKey))) {
          throw new VerifyError('Invalid validator public key');
        }
      });
    }
  }

  private async verifyValidator(): Promise<void> {
    if (this.field !== REGISTERED) {
      throw new VerifyError(`Invalid field ${this.field}`);
    }
  }
}
