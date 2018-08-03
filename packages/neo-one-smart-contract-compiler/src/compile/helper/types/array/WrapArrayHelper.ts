import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [arr]
// Output: [arrayVal]
export class WrapArrayHelper extends CreatePrimitiveHelper {
  protected readonly type = Types.Array;
}
