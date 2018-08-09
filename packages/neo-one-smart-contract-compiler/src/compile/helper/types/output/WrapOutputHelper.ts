import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [attr]
// Output: [attrVal]
export class WrapOutputHelper extends WrapHelper {
  protected readonly type = Types.Output;
}
