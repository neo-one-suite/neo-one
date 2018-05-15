import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: []
// Output: [nullVal]
export class CreateNullHelper extends CreatePrimitiveHelper {
  protected length = 1;
  protected type = Types.Null;
}
