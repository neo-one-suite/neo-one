import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [string]
// Output: [symbolVal]
export class CreateSymbolHelper extends CreatePrimitiveHelper {
  protected readonly type = Types.Symbol;
}
