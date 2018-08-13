import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapInputHelper extends WrapHelper {
  protected readonly type = Types.Input;
}
