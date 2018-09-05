import { ContractPropertyName } from '../../../constants';
import { IsTransactionHelperBase } from './IsTransactionHelperBase';

// Input: [buffer]
// Output: [boolean]
export class IsProcessedTransactionHelper extends IsTransactionHelperBase {
  protected readonly prefix = ContractPropertyName.processedTransactions;
}
