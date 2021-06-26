import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsTransferHelper extends IsHelper {
  protected readonly type = Types.Transfer;
}
