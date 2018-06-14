import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: []
// Output: [nullVal]
export class CreateNullHelper extends CreatePrimitiveHelper {
  protected readonly length = 1;
  protected readonly type = Types.Null;
}
