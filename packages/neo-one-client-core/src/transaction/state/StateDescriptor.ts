import BN from 'bn.js';
import {
  StateDescriptorType,
  assertStateDescriptorType,
} from './StateDescriptorType';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
  SerializeWire,
  SerializableWire,
  createSerializeWire,
} from '../../Serializable';
import { FeeContext, TransactionVerifyOptions } from '../TransactionBase';
import { InvalidFormatError, VerifyError } from '../../errors';
import { common, UInt160Hex } from '../../common';
import { crypto } from '../../crypto';
import {
  utils,
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
} from '../../utils';

export interface StateDescriptorAdd {
  type: StateDescriptorType;
  key: Buffer;
  field: string;
  value: Buffer;
}

export type StateDescriptorTypeJSON = keyof typeof StateDescriptorType;

export interface StateDescriptorJSON {
  type: StateDescriptorTypeJSON;
  key: string;
  field: string;
  value: string;
}

const VOTES = 'Votes';
const REGISTERED = 'Registered';

export class StateDescriptor
  implements
    SerializableWire<StateDescriptor>,
    SerializableJSON<StateDescriptorJSON> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): StateDescriptor {
    const { reader } = options;
    const type = assertStateDescriptorType(reader.readUInt8());
    const key = reader.readVarBytesLE(100);
    const field = reader.readVarString(32);
    const value = reader.readVarBytesLE(65535);

    switch (type) {
      case StateDescriptorType.Validator:
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
    }

    return new this({
      type,
      key,
      field,
      value,
    });
  }

  public static deserializeWire(
    options: DeserializeWireOptions,
  ): StateDescriptor {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: StateDescriptorType;
  public readonly key: Buffer;
  public readonly field: string;
  public readonly value: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfUInt8 +
      IOHelper.sizeOfVarBytesLE(this.key) +
      IOHelper.sizeOfVarString(this.field) +
      IOHelper.sizeOfVarBytesLE(this.value),
  );

  constructor({ type, key, field, value }: StateDescriptorAdd) {
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
    }
  }

  public getScriptHashesForVerifying(): UInt160Hex[] {
    const { type } = this;
    switch (type) {
      case StateDescriptorType.Account:
        return [common.uInt160ToHex(common.bufferToUInt160(this.key))];
      case StateDescriptorType.Validator:
        return [
          common.uInt160ToHex(
            crypto.getVerificationScriptHash(common.bufferToECPoint(this.key)),
          ),
        ];
    }
  }

  public verify(options: TransactionVerifyOptions): Promise<void> {
    const { type } = this;
    switch (type) {
      case StateDescriptorType.Account:
        return this.verifyAccount(options);
      case StateDescriptorType.Validator:
        return this.verifyValidator();
    }
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeVarBytesLE(this.key);
    writer.writeVarString(this.field);
    writer.writeVarBytesLE(this.value);
  }

  public serializeJSON(context: SerializeJSONContext): StateDescriptorJSON {
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

  private async verifyAccount(
    options: TransactionVerifyOptions,
  ): Promise<void> {
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
          .filter((validator) => validator.registered)
          .map((validator) => validator.publicKey)
          .concat(options.standbyValidators)
          .map((key) => common.ecPointToHex(key)),
      );

      for (const publicKey of publicKeys) {
        if (!validatorPublicKeysSet.has(common.ecPointToHex(publicKey))) {
          throw new VerifyError('Invalid validator public key');
        }
      }
    }
  }

  private async verifyValidator(): Promise<void> {
    if (this.field !== REGISTERED) {
      throw new VerifyError(`Invalid field ${this.field}`);
    }
  }
}
