import { Helper } from '../../Helper';
import { ScriptBuilder } from '../../../sb';
import { SetObjectPropertyHelperBase } from './SetObjectPropertyHelperBase';

// Input: [val, stringProp, objectVal]
// Output: []
export class SetPropertyObjectPropertyHelper extends SetObjectPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getPropertyObject;
  }

  protected setDataProperty(sb: ScriptBuilder): Helper {
    return sb.helpers.setDataPropertyObjectProperty;
  }
}
