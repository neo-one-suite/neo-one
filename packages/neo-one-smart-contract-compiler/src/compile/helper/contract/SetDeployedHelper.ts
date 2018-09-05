import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: []
export class SetDeployedHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [boolean]
    sb.emitPushBoolean(node, true);
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapBoolean);
    // [string, val]
    sb.emitPushString(node, ContractPropertyName.deployed);
    // []
    sb.emitHelper(node, options, sb.helpers.putCommonStorage);
  }
}
