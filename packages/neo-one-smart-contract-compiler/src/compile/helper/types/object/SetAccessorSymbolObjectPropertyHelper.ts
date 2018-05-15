import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { SetObjectAccessorPropertyHelperBase } from './SetObjectAccessorPropertyHelperBase';

// Input: [?getObjectVal, ?setObjectVal, stringProp, objectVal]
// Output: []
export class SetAccessorSymbolObjectPropertyHelper extends SetObjectAccessorPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getSymbolObject;
  }
}
