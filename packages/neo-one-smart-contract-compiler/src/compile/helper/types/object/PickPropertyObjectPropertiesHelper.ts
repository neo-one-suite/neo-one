import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { PickObjectPropertiesHelperBase } from './PickObjectPropertiesHelperBase';

// Input: [stringArr, objectVal, outputObjectVal]
// Output: []
export class PickPropertyObjectPropertiesHelper extends PickObjectPropertiesHelperBase {
  protected getObjectProperty(sb: ScriptBuilder): Helper {
    return sb.helpers.getPropertyObjectProperty;
  }

  protected setObjectDataProperty(sb: ScriptBuilder): Helper {
    return sb.helpers.setDataPropertyObjectProperty;
  }
}
