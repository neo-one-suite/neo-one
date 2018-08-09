import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: []
// Output: [nullVal]
export class WrapNullHelper extends WrapHelper {
  protected readonly length = 1;
  protected readonly type = Types.Null;
}
