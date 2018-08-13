import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapTransactionHelper extends WrapHelper {
  protected readonly type = Types.Transaction;
}
