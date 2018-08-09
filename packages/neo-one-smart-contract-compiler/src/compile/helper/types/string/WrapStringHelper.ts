import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [string]
// Output: [stringVal]
export class WrapStringHelper extends WrapHelper {
  protected readonly type = Types.String;
}
