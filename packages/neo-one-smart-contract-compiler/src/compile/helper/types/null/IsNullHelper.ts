import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsNullHelper extends IsHelper {
  protected type = Types.Null;
}
