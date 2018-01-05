import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: []
// Output: [undefinedVal]
export class CreateUndefinedHelper extends CreatePrimitiveHelper {
  protected length = 1;
  protected type = Types.Undefined;
}
