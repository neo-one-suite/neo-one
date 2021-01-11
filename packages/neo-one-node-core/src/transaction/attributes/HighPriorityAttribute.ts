import { HighPriorityAttributeJSON, HighPriorityAttributeModel } from '@neo-one/client-common';
import { BinaryReader } from '../../utils';
import { VerifyOptions } from '../../Verifiable';
import { Transaction } from '../Transaction';
import { AttributeBase } from './AttributeBase';

export class HighPriorityAttribute
  extends HighPriorityAttributeModel
  implements AttributeBase<HighPriorityAttributeJSON> {
  public static deserializeWithoutType(_reader: BinaryReader) {
    return new HighPriorityAttribute();
  }

  public serializeJSON(): HighPriorityAttributeJSON {
    return {
      type: 'HighPriority',
    };
  }

  public async verify(_verifyOptions: VerifyOptions, _tx: Transaction) {
    return Promise.resolve(true);
  }
}
