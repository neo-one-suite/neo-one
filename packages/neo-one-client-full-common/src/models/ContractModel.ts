import {
  BinaryWriter,
  common,
  ContractParameterTypeModel,
  createSerializeWire,
  crypto,
  SerializableWire,
  SerializeWire,
  UInt160,
  UInt160Hex,
  utils,
} from '@neo-one/client-common';
import { BaseState } from './BaseState';
import { ContractPropertyStateModel, HasDynamicInvoke, HasPayable, HasStorage } from './ContractPropertyStateModel';

export interface ContractModelAdd {
  readonly hash?: UInt160;
  readonly version?: number;
  readonly script: Buffer;
  readonly parameterList: ReadonlyArray<ContractParameterTypeModel>;
  readonly returnType: ContractParameterTypeModel;
  readonly contractProperties: ContractPropertyStateModel;
  readonly name: string;
  readonly codeVersion: string;
  readonly author: string;
  readonly email: string;
  readonly description: string;
}

export class ContractModel extends BaseState implements SerializableWire<ContractModel> {
  public readonly script: Buffer;
  public readonly parameterList: ReadonlyArray<ContractParameterTypeModel>;
  public readonly returnType: ContractParameterTypeModel;
  public readonly name: string;
  public readonly codeVersion: string;
  public readonly author: string;
  public readonly email: string;
  public readonly description: string;
  public readonly contractProperties: ContractPropertyStateModel;
  public readonly hasStorage: boolean;
  public readonly hasDynamicInvoke: boolean;
  public readonly payable: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly hashInternal = utils.lazy(() => crypto.toScriptHash(this.script));
  private readonly hashHexInternal = utils.lazy(() => common.uInt160ToHex(this.hash));

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
  }: ContractModelAdd) {
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

  public get hash(): UInt160 {
    return this.hashInternal();
  }

  public get hashHex(): UInt160Hex {
    return this.hashHexInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractWireBase({ writer, contract: this });
  }
}

export const serializeContractWireBase = ({
  writer,
  contract,
  publishVersion,
}: {
  readonly writer: BinaryWriter;
  readonly contract: ContractModel;
  readonly publishVersion?: number;
}): void => {
  writer.writeVarBytesLE(contract.script);
  writer.writeVarBytesLE(Buffer.from(contract.parameterList as ContractParameterTypeModel[]));
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
