import { UInt160 } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../../DiagnosticMessage';
import { ScriptBuilder } from '../../../sb';
import { Name } from '../../../scope';
import { VisitOptions } from '../../../types';
import { MemberLikeExpression } from '../../types';
import { SmartContractForBase } from '../SmartContractForBase';

// tslint:disable-next-line export-name
export class LinkedSmartContractFor extends SmartContractForBase {
  protected emitAdditionalProperties(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ): void {
    const scriptHash = this.getScriptHash(sb, node);
    if (scriptHash !== undefined) {
      // [objectVal, objectVal]
      sb.emitOp(node, 'DUP');
      // ['address', objectVal, objectVal]
      sb.emitPushString(node, 'address');
      // [address, 'address', objectVal, objectVal]
      sb.emitPushBuffer(node, scriptHash);
      // [val, 'address', objectVal, objectVal]
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
      // [objectVal]
      sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
    }
  }

  protected emitInvoke(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    prop: ts.Declaration,
    _addressName: Name,
    _options: VisitOptions,
  ): void {
    const scriptHash = this.getScriptHash(sb, node);
    if (scriptHash !== undefined) {
      // TODO: remove this and change how we call smart contracts, including our own
      // [string, params, string]
      sb.emitOp(node, 'TUCK');
      // [2, string, params, string]
      sb.emitPushInt(node, 2);
      // [[string, params], string]
      sb.emitOp(node, 'PACK');
      // [string, [string, params]]
      sb.emitOp(node, 'SWAP');
      // [buffer, string, params]
      sb.emitPushBuffer(prop, scriptHash);
      // [result]
      sb.emitSysCall(prop, 'System.Contract.Call');
    }
  }

  private getScriptHash(sb: ScriptBuilder, node: ts.CallExpression): UInt160 | undefined {
    const type = sb.context.analysis.getType(node);
    if (type === undefined) {
      /* istanbul ignore next */
      return undefined;
    }

    const symbol = sb.context.analysis.getSymbolForType(node, type);
    if (symbol === undefined) {
      /* istanbul ignore next */
      return undefined;
    }

    const decl = tsUtils.symbol.getValueDeclaration(symbol);
    if (decl === undefined) {
      /* istanbul ignore next */
      sb.context.reportError(
        node,
        DiagnosticCode.InvalidLinkedSmartContract,
        DiagnosticMessage.InvalidLinkedSmartContractDeclaration,
      );

      /* istanbul ignore next */
      return undefined;
    }

    const filePath = tsUtils.file.getFilePath(tsUtils.node.getSourceFile(decl));
    const name = tsUtils.symbol.getName(symbol);

    return sb.getLinkedScriptHash(node, filePath, name);
  }
}
