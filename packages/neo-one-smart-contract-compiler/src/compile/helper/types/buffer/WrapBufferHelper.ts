import { CreatePrimitiveHelper } from '../CreatePrimitiveHelper';
import { Types } from '../Types';

// Input: [buffer]
// Output: [bufferVal]
export class WrapBufferHelper extends CreatePrimitiveHelper {
  protected readonly type = Types.Buffer;
}
