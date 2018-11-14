import {
  assertContractParameterType,
  common,
  ContractJSON,
  IOHelper,
  JSONHelper,
  toJSONContractParameterType,
  UInt160,
} from '@neo-one/client-common';
import { assertContractPropertyState, ContractModel } from '@neo-one/client-full-common';
import { ContractParameterType } from './contractParameter';
import { ContractPropertyState } from './ContractPropertyState';
import { Equals, EquatableKey } from './Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from './Serializable';
import { BinaryReader, utils } from './utils';

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

export class Contract extends ContractModel implements SerializableJSON<ContractJSON>, EquatableKey {
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

  public readonly equals: Equals = utils.equals(Contract, this, (other) => common.uInt160Equal(this.hash, other.hash));
  public readonly toKeyString = utils.toKeyString(Contract, () => this.hashHex);
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

  public get size(): number {
    return this.contractSizeInternal();
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
