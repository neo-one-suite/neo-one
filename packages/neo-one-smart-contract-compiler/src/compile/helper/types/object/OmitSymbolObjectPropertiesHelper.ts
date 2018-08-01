import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { OmitObjectPropertiesHelperBase } from './OmitObjectPropertiesHelperBase';

// Input: [stringArr, objectVal]
// Output: []
export class OmitSymbolObjectPropertiesHelper extends OmitObjectPropertiesHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getSymbolObject;
  }
}
