import { Node } from 'ts-simple-ast';

import { ScriptBuilder } from '../../../sb';
import { Helper } from '../../Helper';
import { GetObjectPropertyHelperBase } from './GetObjectPropertyHelperBase';

// Input: [stringProp, objectVal]
// Output: [val]
export class GetPropertyObjectPropertyHelper extends GetObjectPropertyHelperBase {
  protected getObject(sb: ScriptBuilder): Helper<Node> {
    return sb.helpers.getPropertyObject;
  }
}
