import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsNumberHelper extends IsHelper {
  protected readonly type = Types.Number;
}
