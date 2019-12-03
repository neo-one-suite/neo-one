import {
  BinaryWriter,
  createSerializeWire,
  ECPoint,
  SerializableWire,
  SerializeWire,
  SignatureString,
} from '@neo-one/client-common';
import { BaseState } from './BaseState';

export interface ContractGroupModelAdd {
  readonly publicKey: ECPoint;
  readonly signature: SignatureString;
}

export class ContractGroupModel extends BaseState implements SerializableWire<ContractGroupModel> {
  public readonly publicKey: ECPoint;
  public readonly signature: SignatureString;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ publicKey, signature }: ContractGroupModelAdd) {
    super({ version: undefined });
    this.publicKey = publicKey;
    this.signature = signature;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractGroupWireBase({ writer, group: this });
  }
}

export const serializeContractGroupWireBase = ({
  writer,
  group,
}: {
  readonly writer: BinaryWriter;
  readonly group: ContractGroupModel;
}): void => {
  writer.writeECPoint(group.publicKey);
  writer.writeVarString(group.signature);
};
