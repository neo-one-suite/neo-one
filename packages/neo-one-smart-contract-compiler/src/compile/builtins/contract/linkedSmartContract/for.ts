import { UInt160 } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../../DiagnosticMessage';
import { ScriptBuilder } from '../../../sb';
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
    callBuffer: Buffer,
    _options: VisitOptions,
  ): void {
    const type = sb.context.analysis.getType(node);
    if (type === undefined) {
      /* istanbul ignore next */
      return;
    }

    const smartContractType = tsUtils.type_.getIntersectionTypesArray(type)[0];
    const symbol = sb.context.analysis.getSymbolForType(prop, smartContractType);
    if (symbol === undefined) {
      /* istanbul ignore next */
      return;
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
      return;
    }

    const filePath = tsUtils.file.getFilePath(tsUtils.node.getSourceFile(decl));
    const name = tsUtils.symbol.getName(symbol);
    const scriptHash = sb.getLinkedScriptHash(node, filePath, name);
    if (scriptHash !== undefined) {
      // [result]
      sb.emitOp(prop, 'CALL_E', Buffer.concat([callBuffer, scriptHash]));
    }
  }

  private getScriptHash(sb: ScriptBuilder, node: ts.CallExpression): UInt160 | undefined {
    const type = sb.context.analysis.getType(node);
    if (type === undefined) {
      /* istanbul ignore next */
      return undefined;
    }

    const smartContractType = tsUtils.type_.getIntersectionTypesArray(type)[0];
    const symbol = sb.context.analysis.getSymbolForType(node, smartContractType);
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
