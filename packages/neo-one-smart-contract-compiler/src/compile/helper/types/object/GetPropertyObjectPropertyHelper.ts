import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { GetObjectPropertyHelperBase } from './GetObjectPropertyHelperBase';

// Input: [stringProp, objectVal]
// Output: [val]
export class GetPropertyObjectPropertyHelper extends GetObjectPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getPropertyObject;
  }
}
