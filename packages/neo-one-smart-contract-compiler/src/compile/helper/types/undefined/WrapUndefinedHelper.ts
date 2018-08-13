import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: []
// Output: [undefinedVal]
export class WrapUndefinedHelper extends WrapHelper {
  protected readonly length = 1;
  protected readonly type = Types.Undefined;
}
