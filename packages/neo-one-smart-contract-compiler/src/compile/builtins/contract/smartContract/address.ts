import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ContractPropertyName } from '../../../../constants';
import { ScriptBuilder } from '../../../sb';
import { VisitOptions } from '../../../types';
import { BuiltinInstanceMemberValue, BuiltinType, MemberLikeExpression } from '../../types';

// tslint:disable-next-line export-name
export class SmartContractAddress implements BuiltinInstanceMemberValue {
  public readonly types = new Set([BuiltinType.InstanceMemberValue]);

  public emitValue(sb: ScriptBuilder, node: MemberLikeExpression, options: VisitOptions, visited = false): void {
    let isLinkedSmartContract = false;
    if (ts.isBindingElement(node)) {
      const propNode = tsUtils.node.getNameNode(node);
      const propSymbol = sb.context.analysis.getSymbol(propNode);
      if (propSymbol !== undefined) {
        const parentSymbol = tsUtils.symbol.getParent(propSymbol);
        if (parentSymbol !== undefined) {
          const decls = tsUtils.symbol.getDeclarations(parentSymbol);
          if (decls.length > 0) {
            isLinkedSmartContract = !sb.isCurrentSmartContract(decls[0]);
          }
        }
      }
    } else {
      isLinkedSmartContract = !sb.isCurrentSmartContract(tsUtils.expression.getExpression(node));
    }

    if (isLinkedSmartContract) {
      if (!visited && (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))) {
        // [val]
        sb.visit(tsUtils.expression.getExpression(node), sb.pushValueOptions(options));
      }

      // [string, val]
      sb.emitPushString(node, ContractPropertyName.address);
      // [val]
      sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);

      return;
    }

    if (visited) {
      // []
      sb.emitOp(node, 'DROP');
    }

    if (options.pushValue) {
      // [value]
      sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
      // [val]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }
}
