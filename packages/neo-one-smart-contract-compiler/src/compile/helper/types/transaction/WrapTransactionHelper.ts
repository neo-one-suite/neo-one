import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapTransactionHelper extends WrapHelper {
  protected readonly type = Types.Transaction;
}
