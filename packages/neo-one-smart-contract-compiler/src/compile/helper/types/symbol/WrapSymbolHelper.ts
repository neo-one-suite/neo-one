import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [string]
// Output: [symbolVal]
export class WrapSymbolHelper extends WrapHelper {
  protected readonly type = Types.Symbol;
}
