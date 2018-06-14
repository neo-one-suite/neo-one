import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsObjectHelper extends IsHelper {
  protected readonly type = Types.Object;
}
