import { BaseState } from './BaseState';
import { common, UInt160, UInt160Hex } from './common';
import {
  assertContractParameterType,
  ContractParameterType,
  ContractParameterTypeJSON,
  toJSONContractParameterType,
} from './contractParameter';
import {
  assertContractPropertyState,
  ContractPropertyState,
  HasDynamicInvoke,
  HasPayable,
  HasStorage,
} from './ContractPropertyState';
import { crypto } from './crypto';
import { Equals, EquatableKey } from './Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from './Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from './utils';

export interface ContractKey {
  readonly hash: UInt160;
}
export interface ContractAdd {
  readonly hash?: UInt160;
  readonly version?: number;
  readonly script: Buffer;
  readonly parameterList: ReadonlyArray<ContractParameterType>;
  readonly returnType: ContractParameterType;
  readonly contractProperties: ContractPropertyState;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
}

export interface ContractJSON {
  readonly version: number;
  readonly hash: string;
  readonly script: string;
  readonly parameters: ReadonlyArray<ContractParameterTypeJSON>;
  readonly returntype: ContractParameterTypeJSON;
  readonly name: string;
  readonly code_version: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly properties: {
    readonly storage: boolean;
    readonly dynamic_invoke: boolean;
    readonly payable: boolean;
  };
}

export class Contract extends BaseState
  implements SerializableWire<Contract>, SerializableJSON<ContractJSON>, EquatableKey {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Contract {
    return deserializeContractWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Contract {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly script: Buffer;
  public readonly parameterList: ReadonlyArray<ContractParameterType>;
  public readonly returnType: ContractParameterType;
  public readonly name: string;
  public readonly codeVersion: string;
  public readonly author: string;
  public readonly email: string;
  public readonly description: string;
  public readonly contractProperties: ContractPropertyState;
  public readonly hasStorage: boolean;
  public readonly hasDynamicInvoke: boolean;
  public readonly payable: boolean;
  public readonly equals: Equals = utils.equals(Contract, this, (other) => common.uInt160Equal(this.hash, other.hash));
  public readonly toKeyString = utils.toKeyString(Contract, () => this.hashHex);
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly hashInternal = utils.lazy(() => crypto.toScriptHash(this.script));
  private readonly hashHexInternal = utils.lazy(() => common.uInt160ToHex(this.hash));
  private readonly contractSizeInternal = utils.lazy(() =>
    sizeOfContract({
      script: this.script,
      parameterList: this.parameterList,
      name: this.name,
      codeVersion: this.codeVersion,
      author: this.author,
      email: this.email,
      description: this.description,
    }),
  );

  public constructor({
    version,
    script,
    parameterList,
    returnType,
    name,
    codeVersion,
    author,
    email,
    description,
    contractProperties,
  }: ContractAdd) {
    super({ version });
    this.script = script;
    this.parameterList = parameterList;
    this.returnType = returnType;
    this.name = name;
    this.codeVersion = codeVersion;
    this.author = author;
    this.email = email;
    this.description = description;
    this.contractProperties = contractProperties;

    this.hasStorage = HasStorage.has(this.contractProperties);
    this.hasDynamicInvoke = HasDynamicInvoke.has(this.contractProperties);
    this.payable = HasPayable.has(this.contractProperties);
  }

  public get size(): number {
    return this.contractSizeInternal();
  }

  public get hash(): UInt160 {
    return this.hashInternal();
  }

  public get hashHex(): UInt160Hex {
    return this.hashHexInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractWireBase({ writer, contract: this });
  }

  public serializeJSON(_context: SerializeJSONContext): ContractJSON {
    return {
      version: this.version,
      hash: JSONHelper.writeUInt160(this.hash),
      script: JSONHelper.writeBuffer(this.script),
      parameters: this.parameterList.map(toJSONContractParameterType),

      returntype: toJSONContractParameterType(this.returnType),
      name: this.name,
      code_version: this.codeVersion,
      author: this.author,
      email: this.email,
      description: this.description,
      properties: {
        storage: this.hasStorage,
        dynamic_invoke: this.hasDynamicInvoke,
        payable: this.payable,
      },
    };
  }
}

export const sizeOfContract = ({
  script,
  parameterList,
  name,
  codeVersion,
  author,
  email,
  description,
  publishVersion,
}: {
  readonly script: Buffer;
  readonly parameterList: ReadonlyArray<ContractParameterType>;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
  readonly publishVersion?: number;
}) =>
  IOHelper.sizeOfVarBytesLE(script) +
  IOHelper.sizeOfVarBytesLE(Buffer.from(parameterList as ContractParameterType[])) +
  IOHelper.sizeOfUInt8 +
  (publishVersion === undefined ? IOHelper.sizeOfBoolean : 0) +
  IOHelper.sizeOfVarString(name) +
  IOHelper.sizeOfVarString(codeVersion) +
  IOHelper.sizeOfVarString(author) +
  IOHelper.sizeOfVarString(email) +
  IOHelper.sizeOfVarString(description);

export const deserializeContractWireBase = ({
  reader,
  publishVersion,
}: {
  readonly publishVersion?: number;
} & DeserializeWireBaseOptions): Contract => {
  const script = reader.readVarBytesLE();
  const parameterList = [...reader.readVarBytesLE()].map(assertContractParameterType);

  const returnType = assertContractParameterType(reader.readUInt8());
  const contractProperties =
    publishVersion === undefined || publishVersion >= 1
      ? assertContractPropertyState(reader.readUInt8())
      : ContractPropertyState.NoProperty;
  const name = reader.readVarString(252);
  const codeVersion = reader.readVarString(252);
  const author = reader.readVarString(252);
  const email = reader.readVarString(252);
  const description = reader.readVarString(65536);

  return new Contract({
    script,
    parameterList,
    returnType,
    contractProperties,
    name,
    codeVersion,
    author,
    email,
    description,
  });
};

export const serializeContractWireBase = ({
  writer,
  contract,
  publishVersion,
}: {
  readonly writer: BinaryWriter;
  readonly contract: Contract;
  readonly publishVersion?: number;
}): void => {
  writer.writeVarBytesLE(contract.script);
  writer.writeVarBytesLE(Buffer.from(contract.parameterList as ContractParameterType[]));
  writer.writeUInt8(contract.returnType);
  if (publishVersion === undefined || publishVersion >= 1) {
    writer.writeUInt8(contract.contractProperties);
  }
  writer.writeVarString(contract.name);
  writer.writeVarString(contract.codeVersion);
  writer.writeVarString(contract.author);
  writer.writeVarString(contract.email);
  writer.writeVarString(contract.description);
};
