import { BaseState } from './BaseState';
import {
  ContractParameterType,
  ContractParameterTypeJSON,
  assertContractParameterType,
  toJSONContractParameterType,
} from './contractParameter';
import {
  ContractPropertyState,
  HasDynamicInvoke,
  HasPayable,
  HasStorage,
  assertContractPropertyState,
} from './ContractPropertyState';
import { Equatable, Equals } from './Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializeWire,
  SerializableWire,
  SerializeJSONContext,
  SerializableJSON,
  createSerializeWire,
} from './Serializable';
import { common, UInt160, UInt160Hex } from './common';
import { crypto } from './crypto';
import {
  utils,
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
} from './utils';

export interface ContractKey {
  hash: UInt160;
}
export interface ContractAdd {
  hash?: UInt160;
  version?: number;
  script: Buffer;
  parameterList: ContractParameterType[];
  returnType: ContractParameterType;
  contractProperties: ContractPropertyState;
  name: string;
  codeVersion: string;
  author: string;
  email: string;
  description: string;
}

export interface ContractJSON {
  version: number;
  hash: string;
  script: string;
  parameters: ContractParameterTypeJSON[];
  returntype: ContractParameterTypeJSON;
  name: string;
  code_version: string;
  author: string;
  email: string;
  description: string;
  properties: {
    storage: boolean;
    dynamic_invoke: boolean;
    payable: boolean;
  };
}

export class Contract extends BaseState
  implements
    SerializableWire<Contract>,
    SerializableJSON<ContractJSON>,
    Equatable {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): Contract {
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
  public readonly parameterList: ContractParameterType[];
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
  public readonly equals: Equals = utils.equals(Contract, (other) =>
    common.uInt160Equal(this.hash, other.hash),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  private readonly hashInternal = utils.lazy(() =>
    crypto.toScriptHash(this.script),
  );
  private readonly hashHexInternal = utils.lazy(() =>
    common.uInt160ToHex(this.hash),
  );
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

  constructor({
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

  public serializeJSON(context: SerializeJSONContext): ContractJSON {
    return {
      version: this.version,
      hash: JSONHelper.writeUInt160(this.hash),
      script: JSONHelper.writeBuffer(this.script),
      parameters: this.parameterList.map((parameter) =>
        toJSONContractParameterType(parameter),
      ),

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
  script: Buffer;
  parameterList: ContractParameterType[];
  name: string;
  codeVersion: string;
  author: string;
  email: string;
  description: string;
  publishVersion?: number;
}) =>
  IOHelper.sizeOfVarBytesLE(script) +
  IOHelper.sizeOfVarBytesLE(Buffer.from(parameterList)) +
  IOHelper.sizeOfUInt8 +
  (publishVersion == null ? IOHelper.sizeOfBoolean : 0) +
  IOHelper.sizeOfVarString(name) +
  IOHelper.sizeOfVarString(codeVersion) +
  IOHelper.sizeOfVarString(author) +
  IOHelper.sizeOfVarString(email) +
  IOHelper.sizeOfVarString(description);

export const deserializeContractWireBase = ({
  reader,
  publishVersion,
}: {
  publishVersion?: number;
} & DeserializeWireBaseOptions): Contract => {
  const script = reader.readVarBytesLE();
  const parameterList = [...reader.readVarBytesLE()].map((value) =>
    assertContractParameterType(value),
  );

  const returnType = assertContractParameterType(reader.readUInt8());
  const contractProperties =
    publishVersion == null || publishVersion >= 1
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
  writer: BinaryWriter;
  contract: Contract;
  publishVersion?: number;
}): void => {
  writer.writeVarBytesLE(contract.script);
  writer.writeVarBytesLE(Buffer.from(contract.parameterList));
  writer.writeUInt8(contract.returnType);
  if (publishVersion == null || publishVersion >= 1) {
    writer.writeUInt8(contract.contractProperties);
  }
  writer.writeVarString(contract.name);
  writer.writeVarString(contract.codeVersion);
  writer.writeVarString(contract.author);
  writer.writeVarString(contract.email);
  writer.writeVarString(contract.description);
};
