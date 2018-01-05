import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [boolean]
// Output: [booleanVal]
export class CreateBooleanHelper extends CreatePrimitiveHelper {
  protected type = Types.Boolean;
}
