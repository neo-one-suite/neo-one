import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapInputHelper extends WrapHelper {
  protected readonly type = Types.Input;
}
