import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsNumberHelper extends IsHelper {
  protected readonly type = Types.Number;
}
