import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [boolean]
// Output: [booleanVal]
export class WrapBooleanHelper extends WrapHelper {
  protected readonly type = Types.Boolean;
}
