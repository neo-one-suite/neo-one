import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [arr]
// Output: [arrayVal]
export class WrapArrayHelper extends WrapHelper {
  protected readonly type = Types.Array;
}
