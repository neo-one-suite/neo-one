import { Types } from '../Types';
import { WrapHelper } from '../WrapHelper';

// Input: [buffer]
// Output: [bufferVal]
export class WrapBufferHelper extends WrapHelper {
  protected readonly type = Types.Buffer;
}
