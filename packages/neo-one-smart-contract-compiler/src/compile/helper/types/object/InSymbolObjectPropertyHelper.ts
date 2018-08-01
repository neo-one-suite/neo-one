import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { InObjectPropertyHelperBase } from './InObjectPropertyHelperBase';

// Input: [stringProp, objectVal]
// Output: [val]
export class InSymbolObjectPropertyHelper extends InObjectPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper {
    return sb.helpers.getSymbolObject;
  }
}
