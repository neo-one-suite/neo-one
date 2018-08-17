import { Types } from '../../../constants';
import { IsHelper } from '../IsHelper';

// Input: [val]
// Output: [boolean]
export class IsBufferHelper extends IsHelper {
  protected readonly type = Types.Buffer;
}
