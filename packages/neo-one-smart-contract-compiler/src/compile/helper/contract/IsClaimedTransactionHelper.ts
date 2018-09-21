import { ContractPropertyName } from '../../../constants';
import { IsTransactionHelperBase } from './IsTransactionHelperBase';

// Input: [buffer]
// Output: [boolean]
export class IsClaimedTransactionHelper extends IsTransactionHelperBase {
  protected readonly prefix = ContractPropertyName.claimedTransactions;
}
