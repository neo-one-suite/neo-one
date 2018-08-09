import { IsHelper } from '../IsHelper';
import { Types } from '../Types';

// Input: [val]
// Output: [boolean]
export class IsOutputHelper extends IsHelper {
  protected readonly type = Types.Output;
}
