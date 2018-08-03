import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsArrayHelper extends IsHelper {
  protected readonly type = Types.Array;
}
