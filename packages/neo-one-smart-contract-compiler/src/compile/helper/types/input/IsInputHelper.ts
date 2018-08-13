import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsInputHelper extends IsHelper {
  protected readonly type = Types.Input;
}
