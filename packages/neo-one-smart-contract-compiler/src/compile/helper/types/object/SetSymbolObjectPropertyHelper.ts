import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { SetObjectPropertyHelperBase } from './SetObjectPropertyHelperBase';

// Input: [val, stringProp, objectVal]
// Output: []
export class SetSymbolObjectPropertyHelper extends SetObjectPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getSymbolObject;
  }

  protected setDataProperty(sb: ScriptBuilder): Helper {
    return sb.helpers.setDataSymbolObjectProperty;
  }
}
