import {
  BinaryWriter,
  createSerializeWire,
  ECPoint,
  SerializableWire,
  SerializeWire,
  SignatureString,
} from '@neo-one/client-common';

export interface ContractGroupModelAdd {
  readonly publicKey: ECPoint;
  readonly signature: SignatureString;
}

export class ContractGroupModel implements SerializableWire<ContractGroupModel> {
  public readonly publicKey: ECPoint;
  public readonly signature: SignatureString;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ publicKey, signature }: ContractGroupModelAdd) {
    this.publicKey = publicKey;
    this.signature = signature;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeECPoint(this.publicKey);
    writer.writeVarString(this.signature);
  }
}
