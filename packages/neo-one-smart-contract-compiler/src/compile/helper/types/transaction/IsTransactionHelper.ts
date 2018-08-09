import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsTransactionHelper extends IsHelper {
  protected readonly type = Types.Transaction;
}
