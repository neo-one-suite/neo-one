import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsObjectHelper extends IsHelper {
  protected readonly type = Types.Object;
}
