import { AttributeJSON, SerializableJSON } from '@neo-one/client-common';
import { VerifyOptions } from '../../Verifiable';
import { Transaction } from '../Transaction';

export interface AttributeBase<T extends AttributeJSON> extends SerializableJSON<T> {
  readonly verify: (verifyOptions: VerifyOptions, tx: Transaction) => Promise<boolean>;
}
