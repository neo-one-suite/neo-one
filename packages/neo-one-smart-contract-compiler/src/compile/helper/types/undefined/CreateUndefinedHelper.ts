import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: []
// Output: [undefinedVal]
export class CreateUndefinedHelper extends CreatePrimitiveHelper {
  protected readonly length = 1;
  protected readonly type = Types.Undefined;
}
