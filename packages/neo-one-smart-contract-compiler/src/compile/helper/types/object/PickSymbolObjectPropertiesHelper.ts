import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { PickObjectPropertiesHelperBase } from './PickObjectPropertiesHelperBase';

// Input: [stringArr, objectVal, outputObjectVal]
// Output: []
export class PickSymbolObjectPropertiesHelper extends PickObjectPropertiesHelperBase {
  protected getObjectProperty(sb: ScriptBuilder): Helper {
    return sb.helpers.getSymbolObjectProperty;
  }

  protected setObjectDataProperty(sb: ScriptBuilder): Helper {
    return sb.helpers.setDataSymbolObjectProperty;
  }
}
