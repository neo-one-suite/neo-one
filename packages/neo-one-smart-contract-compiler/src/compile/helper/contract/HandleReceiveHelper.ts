import { HandleSendUnsafeReceiveHelperBase } from './HandleSendUnsafeReceiveHelperBase';

// Input: []
// Output: [boolean]
export class HandleReceiveHelper extends HandleSendUnsafeReceiveHelperBase {
  protected readonly lessThan = false;
}
