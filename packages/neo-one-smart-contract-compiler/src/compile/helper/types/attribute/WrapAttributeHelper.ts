import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapAttributeHelper extends WrapHelper {
  protected readonly type = Types.Attribute;
}
