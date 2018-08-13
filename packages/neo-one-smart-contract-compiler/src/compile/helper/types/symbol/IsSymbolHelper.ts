import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsSymbolHelper extends IsHelper {
  protected readonly type = Types.Symbol;
}
