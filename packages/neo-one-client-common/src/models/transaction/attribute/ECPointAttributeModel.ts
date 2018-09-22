import { BinaryWriter } from '../../../BinaryWriter';
import { common, ECPoint } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';

export type ECPointAttributeUsageModel = 0x02 | 0x03;

export interface ECPointAttributeModelAdd {
  readonly usage: ECPointAttributeUsageModel;
  readonly value: ECPoint;
}

export class ECPointAttributeModel extends AttributeBaseModel<ECPointAttributeUsageModel, ECPoint> {
  public readonly usage: ECPointAttributeUsageModel;
  public readonly value: ECPoint;

  public constructor({ usage, value }: ECPointAttributeModelAdd) {
    super();
    this.usage = usage;
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(common.ecPointToBuffer(this.value).slice(1));
  }
}
