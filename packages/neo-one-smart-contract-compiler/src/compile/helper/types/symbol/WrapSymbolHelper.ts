import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [string]
// Output: [symbolVal]
export class WrapSymbolHelper extends WrapHelper {
  protected readonly type = Types.Symbol;
}
