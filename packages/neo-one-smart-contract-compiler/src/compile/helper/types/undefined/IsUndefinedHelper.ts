import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsUndefinedHelper extends IsHelper {
  protected readonly type = Types.Undefined;
}
