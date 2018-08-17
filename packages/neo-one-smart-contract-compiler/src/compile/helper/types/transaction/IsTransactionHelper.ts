import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsTransactionHelper extends IsHelper {
  protected readonly type = Types.Transaction;
}
