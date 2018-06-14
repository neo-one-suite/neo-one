import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { SetObjectAccessorPropertyHelperBase } from './SetObjectAccessorPropertyHelperBase';

// Input: [?getObjectVal, ?setObjectVal, stringProp, objectVal]
// Output: []
export class SetAccessorPropertyObjectPropertyHelper extends SetObjectAccessorPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getPropertyObject;
  }
}
