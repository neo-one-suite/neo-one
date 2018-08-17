import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [number]
// Output: [numberVal]
export class WrapNumberHelper extends WrapHelper {
  protected readonly type = Types.Number;
}
