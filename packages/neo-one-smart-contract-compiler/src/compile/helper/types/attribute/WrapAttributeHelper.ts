import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapAttributeHelper extends WrapHelper {
  protected readonly type = Types.Attribute;
}
