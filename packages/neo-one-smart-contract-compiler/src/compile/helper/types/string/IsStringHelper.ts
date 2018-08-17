import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsStringHelper extends IsHelper {
  protected readonly type = Types.String;
}
