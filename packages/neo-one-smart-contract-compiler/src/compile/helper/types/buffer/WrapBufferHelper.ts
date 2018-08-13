import { Types } from '../../../constants';
import { WrapHelper } from '../WrapHelper';

// Input: [buffer]
// Output: [bufferVal]
export class WrapBufferHelper extends WrapHelper {
  protected readonly type = Types.Buffer;
}
