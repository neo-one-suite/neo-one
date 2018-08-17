import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsBooleanHelper extends IsHelper {
  protected readonly type = Types.Boolean;
}
