import { CallExpression, Node, SyntaxKind, TypeGuards } from 'ts-simple-ast';

import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { SYSCALLS } from '../syscalls';
import { VisitOptions } from '../types';

export class CallExpressionCompiler extends NodeCompiler<CallExpression> {
  public readonly kind: SyntaxKind = SyntaxKind.CallExpression;

  public visitNode(sb: ScriptBuilder, expr: CallExpression, optionsIn: VisitOptions): void {
    const func = expr.getExpression();
    if (TypeGuards.isIdentifier(func) && sb.isGlobalSymbol(func, sb.getSymbol(func), 'syscall')) {
      this.handleSysCall(sb, expr, optionsIn);

      return;
    }

    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    // [argsarr]
    sb.emitHelper(expr, options, sb.helpers.args);

    if (TypeGuards.isSuperExpression(func)) {
      this.handleSuperConstruct(sb, expr, options);

      return;
    }

    let bindThis;
    if (TypeGuards.isElementAccessExpression(func) || TypeGuards.isPropertyAccessExpression(func)) {
      bindThis = true;

      const lhs = func.getExpression();
      if (TypeGuards.isSuperExpression(lhs)) {
        // [thisValue, argsarr]
        sb.scope.getThis(sb, lhs, options);
        // [superPrototype, thisValue, argsarr]
        sb.visit(lhs, options);
      } else {
        // [expr, argsarr]
        sb.visit(lhs, options);
        // [expr, expr, argsarr]
        sb.emitOp(func, 'DUP');
      }

      if (TypeGuards.isElementAccessExpression(func)) {
        // [objectVal, expr, argsarr]
        sb.emitHelper(func, options, sb.helpers.elementAccess);
      } else {
        // [name, expr, expr, argsarr]
        sb.emitPushString(func.getNameNode(), func.getName());
        // [objectVal, expr, argsarr]
        sb.emitHelper(expr, options, sb.helpers.getPropertyObjectProperty);
      }
    } else {
      bindThis = false;
      // [objectVal, argsarr]
      sb.visit(func, options);
    }

    sb.emitHelper(expr, options, sb.helpers.invokeCall({ bindThis }));

    if (!optionsIn.pushValue) {
      sb.emitOp(expr, 'DROP');
    }
  }

  private handleSysCall(sb: ScriptBuilder, node: CallExpression, options: VisitOptions): void {
    const sysCallName = node.getArguments()[0] as Node | undefined;

    const reportError = () => {
      sb.reportError(
        node,
        'First argument to syscall must be a string literal corresponding to a NEO syscall.',
        DiagnosticCode.INVALID_SYS_CALL,
      );
    };
    if (sysCallName === undefined || !TypeGuards.isStringLiteral(sysCallName)) {
      reportError();

      return;
    }

    const sysCallKey = sysCallName.getLiteralValue() as keyof typeof SYSCALLS;
    const sysCall = SYSCALLS[sysCallKey] as typeof SYSCALLS[keyof typeof SYSCALLS] | undefined;
    if (sysCall === undefined) {
      reportError();
    } else {
      sysCall.handleCall(sb, node, options);
    }
  }

  private handleSuperConstruct(sb: ScriptBuilder, node: CallExpression, options: VisitOptions): void {
    const superClass = options.superClass;
    if (superClass === undefined) {
      throw new Error('Something went wrong, expected super class to be defined.');
    }
    // [thisValue, argsarr]
    sb.scope.getThis(sb, node, options);
    // [ctor, thisValue, argsarr]
    sb.scope.get(sb, node, options, superClass);
    // []
    sb.emitHelper(node, options, sb.helpers.invokeConstruct());
  }
}
