import { BinaryWriter } from '../../../BinaryWriter';
import { common, ECPoint } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeUsageModel } from './AttributeUsageModel';

export type ECPointAttributeUsageModel = AttributeUsageModel.ECDH02 | AttributeUsageModel.ECDH03;

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
