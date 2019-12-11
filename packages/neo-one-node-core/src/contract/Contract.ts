import { common, ContractJSON, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractModel, ContractModelAdd } from '@neo-one/client-full-common';
import { Equals, EquatableKey } from '../Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { ContractManifest } from './ContractManifest';

export interface ContractKey {
  readonly hash: UInt160;
}
export interface ContractAdd extends ContractModelAdd {}

export class Contract extends ContractModel implements SerializableJSON<ContractJSON>, EquatableKey {
  public get size(): number {
    return this.contractSizeInternal();
  }
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

  public readonly equals: Equals = utils.equals(Contract, this, (other) =>
    common.uInt160Equal(this.manifest.abi.hash, other.manifest.abi.hash),
  );
  public readonly toKeyString = utils.toKeyString(Contract, () => common.uInt160ToHex(this.manifest.abi.hash));

  public readonly manifestDeserializable: ContractManifest;

  private readonly contractSizeInternal = utils.lazy(() =>
    sizeOfContract({
      script: this.script,
      manifest: this.manifestDeserializable,
    }),
  );

  public constructor({ script, manifest }: ContractAdd) {
    super({ script, manifest });
    this.manifestDeserializable = new ContractManifest({
      groups: manifest.groups,
      features: manifest.features,
      abi: manifest.abi,
      permissions: manifest.permissions,
      trusts: manifest.trusts,
      safeMethods: manifest.safeMethods,
    });
  }

  public serializeJSON(context: SerializeJSONContext): ContractJSON {
    return {
      script: JSONHelper.writeBuffer(this.script),
      manifest: this.manifestDeserializable.serializeJSON(context),
    };
  }
}

export const sizeOfContract = ({
  script,
  manifest,
}: {
  readonly script: Buffer;
  readonly manifest: ContractManifest;
}) => IOHelper.sizeOfVarBytesLE(script) + manifest.size;

export const deserializeContractWireBase = ({ reader, context }: DeserializeWireBaseOptions): Contract => {
  const script = reader.readVarBytesLE();
  const manifest = ContractManifest.deserializeWireBase({ reader, context });

  return new Contract({
    script,
    manifest,
  });
};
