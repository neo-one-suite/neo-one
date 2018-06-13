import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { SetObjectDataPropertyHelperBase } from './SetObjectDataPropertyHelperBase';

// Input: [val, stringProp, objectVal]
// Output: []
export class SetDataSymbolObjectPropertyHelper extends SetObjectDataPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getSymbolObject;
  }
}
