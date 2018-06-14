import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsBooleanHelper extends IsHelper {
  protected readonly type = Types.Boolean;
}
