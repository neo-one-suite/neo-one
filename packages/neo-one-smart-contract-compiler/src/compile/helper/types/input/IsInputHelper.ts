import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsInputHelper extends IsHelper {
  protected readonly type = Types.Input;
}
