import { common, ContractGroupJSON, ECPoint, IOHelper, SignatureString } from '@neo-one/client-common';
import { ContractGroupModel, ContractGroupModelAdd } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../Serializable';
import { BinaryReader, utils } from '../../utils';

export interface ContractGroupAdd extends ContractGroupModelAdd {}

export class ContractGroup extends ContractGroupModel implements SerializableJSON<ContractGroupJSON> {
  public get size(): number {
    return this.contractGroupSizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractGroup {
    return deserializeContractGroupWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractGroup {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly contractGroupSizeInternal = utils.lazy(() =>
    sizeOfContractGroup({
      publicKey: this.publicKey,
      signature: this.signature,
    }),
  );

  public serializeJSON(_context: SerializeJSONContext): ContractGroupJSON {
    return {
      publicKey: common.ecPointToString(this.publicKey),
      signature: this.signature,
    };
  }
}

export const sizeOfContractGroup = ({
  publicKey,
  signature,
}: {
  readonly publicKey: ECPoint;
  readonly signature: SignatureString;
}) => IOHelper.sizeOfECPoint(publicKey) + IOHelper.sizeOfVarString(signature);

export const deserializeContractGroupWireBase = ({ reader }: DeserializeWireBaseOptions): ContractGroup => {
  const publicKey = reader.readECPoint();
  const signature = reader.readVarString();

  return new ContractGroup({
    publicKey,
    signature,
  });
};
