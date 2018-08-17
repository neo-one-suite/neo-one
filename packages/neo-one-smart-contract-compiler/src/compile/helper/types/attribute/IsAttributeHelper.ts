import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsAttributeHelper extends IsHelper {
  protected readonly type = Types.Attribute;
}
