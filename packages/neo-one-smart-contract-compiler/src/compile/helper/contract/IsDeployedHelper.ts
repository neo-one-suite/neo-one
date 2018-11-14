import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [boolean]
export class IsDeployedHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      return;
    }

    // [string]
    sb.emitPushString(node, ContractPropertyName.deployed);
    // [value]
    sb.emitHelper(node, options, sb.helpers.getCommonStorage);
    sb.emitHelper(
      node,
      options,
      sb.helpers.handleUndefinedStorage({
        handleUndefined: () => {
          // [boolean]
          sb.emitPushBoolean(node, false);
        },
        handleDefined: () => {
          // [boolean]
          sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
        },
      }),
    );
  }
}
