import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsArrayHelper extends IsHelper {
  protected readonly type = Types.Array;
}
