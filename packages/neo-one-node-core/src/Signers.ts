import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  JSONHelper,
  toWitnessScope,
  WitnessScopeModel,
} from '@neo-one/client-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableContainer,
  SerializableContainerType,
} from './Serializable';
import { Signer } from './Signer';
import { BinaryReader } from './utils';
import { Witness } from './Witness';

export interface SignersAdd {
  readonly signers: readonly Signer[];
}

export class Signers implements SerializableContainer {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Signers {
    const { reader } = options;
    const signers = reader.readArray(() => Signer.deserializeWireBase(options));

    return new this({
      signers,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): Signers {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // tslint:disable-next-line: no-any
  public static fromJSON(json: any): Signers {
    if (!Array.isArray(json)) {
      throw new InvalidFormatError();
    }

    return new Signers({
      signers: json.map(
        (signer) =>
          new Signer({
            account: JSONHelper.readUInt160(signer.account),
            scopes: signer.scopes === undefined ? WitnessScopeModel.None : toWitnessScope(signer?.scopes),
            allowedContracts: signer.allowedcontracts?.map((contract: string) => JSONHelper.readUInt160(contract)),
            allowedGroups: signer.allowedgroups?.map((group: string) => JSONHelper.readECPoint(group)),
          }),
      ),
    });
  }

  public readonly type: SerializableContainerType = 'Signers';
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly signers: readonly Signer[];
  public readonly witnesses: readonly Witness[] = [];

  public constructor({ signers }: SignersAdd) {
    this.signers = signers;
  }

  public getScriptHashesForVerifying() {
    return this.signers.map((signer) => signer.account);
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeArray(this.signers, (signer) => signer.serializeWireBase(writer));
  }
}
