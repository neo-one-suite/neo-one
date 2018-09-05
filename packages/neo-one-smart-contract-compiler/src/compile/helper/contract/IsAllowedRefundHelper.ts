import { ContractPropertyName } from '../../../constants';
import { IsTransactionHelperBase } from './IsTransactionHelperBase';

// Input: [buffer]
// Output: [boolean]
export class IsAllowedRefundHelper extends IsTransactionHelperBase {
  protected readonly prefix = ContractPropertyName.allowedRefunds;
}
