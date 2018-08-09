import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Object: [object]
// Output: [objectVal]
export class WrapObjectHelper extends WrapHelper {
  protected readonly type = Types.Object;
}
