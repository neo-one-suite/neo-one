import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [string]
// Output: [transferVal]
export class WrapTransferHelper extends WrapHelper {
  protected readonly type = Types.Transfer;
}
