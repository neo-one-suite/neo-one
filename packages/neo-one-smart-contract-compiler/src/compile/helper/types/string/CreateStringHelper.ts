import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [string]
// Output: [stringVal]
export class CreateStringHelper extends CreatePrimitiveHelper {
  protected readonly type = Types.String;
}
