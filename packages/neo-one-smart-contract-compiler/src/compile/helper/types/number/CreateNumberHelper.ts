import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [number]
// Output: [numberVal]
export class CreateNumberHelper extends CreatePrimitiveHelper {
  protected readonly type = Types.Number;
}
