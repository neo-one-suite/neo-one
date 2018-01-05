import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [string]
// Output: [stringVal]
export class CreateStringHelper extends CreatePrimitiveHelper {
  protected type = Types.String;
}
