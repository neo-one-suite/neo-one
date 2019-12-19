import { common, ContractJSON, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { ContractModel, ContractModelAdd } from '@neo-one/client-full-common';
import { Equals, EquatableKey } from '../Equatable';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { ContractManifest } from './ContractManifest';

export interface ContractKey {
  readonly hash: UInt160;
}
export type ContractAdd = ContractModelAdd<ContractManifest>;

export class Contract extends ContractModel<ContractManifest> implements SerializableJSON<ContractJSON>, EquatableKey {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Contract {
    const { reader } = options;
    const script = reader.readVarBytesLE();
    const manifest = ContractManifest.deserializeWireBase(options);

    return new this({
      script,
      manifest,
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

  private readonly sizeInternal = utils.lazy(() => IOHelper.sizeOfVarBytesLE(this.script) + this.manifest.size);

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeJSON(): ContractJSON {
    return {
      script: JSONHelper.writeBuffer(this.script),
      manifest: this.manifest.serializeJSON(),
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
