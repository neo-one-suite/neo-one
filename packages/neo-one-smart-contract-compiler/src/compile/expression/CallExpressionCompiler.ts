import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';

import { DiagnosticCode } from '../../DiagnosticCode';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { SYSCALLS } from '../syscalls';
import { VisitOptions } from '../types';

interface SpecialCase {
  readonly test: (sb: ScriptBuilder, expr: ts.CallExpression, symbol: ts.Symbol) => boolean;
  readonly handle: (sb: ScriptBuilder, expr: ts.CallExpression, options: VisitOptions) => void;
}

const bufferFrom: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'BufferFrom'),
  handle: (sb, node, options) => {
    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 2) {
      sb.reportUnsupported(node);

      return;
    }

    const hash = args[0];
    const encoding = args[1];
    if (!ts.isStringLiteral(hash) || !ts.isStringLiteral(encoding)) {
      sb.reportUnsupported(node);

      return;
    }

    if (options.pushValue) {
      sb.emitPushBuffer(
        node,
        Buffer.from(tsUtils.literal.getLiteralValue(hash), tsUtils.literal.getLiteralValue(encoding)),
      );
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  },
};

const bufferEquals: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'BufferEquals'),
  handle: (sb, node, optionsIn) => {
    const func = tsUtils.expression.getExpression(node);
    if (!ts.isPropertyAccessExpression(func)) {
      sb.reportUnsupported(node);

      return;
    }

    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 1) {
      sb.reportUnsupported(node);

      return;
    }

    const options = sb.pushValueOptions(optionsIn);

    const lhs = tsUtils.expression.getExpression(func);
    // [bufferVal]
    sb.visit(lhs, options);
    // [buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [bufferVal, buffer]
    sb.visit(args[0], options);
    // [buffer, buffer]
    sb.emitHelper(node, options, sb.helpers.unwrapBuffer);
    // [boolean]
    sb.emitOp(node, 'EQUAL');
    // [booleanVal]
    sb.emitHelper(node, options, sb.helpers.createBoolean);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  },
};

const CASES: ReadonlyArray<SpecialCase> = [bufferFrom, bufferEquals];

export class CallExpressionCompiler extends NodeCompiler<ts.CallExpression> {
  public readonly kind = ts.SyntaxKind.CallExpression;

  public visitNode(sb: ScriptBuilder, expr: ts.CallExpression, optionsIn: VisitOptions): void {
    const func = tsUtils.expression.getExpression(expr);
    const symbol = sb.getSymbol(func);
    if (ts.isIdentifier(func) && sb.isGlobalSymbol(func, symbol, 'syscall')) {
      this.handleSysCall(sb, expr, optionsIn);

      return;
    }

    if (symbol !== undefined) {
      const specialCase = CASES.find((cse) => cse.test(sb, expr, symbol));
      if (specialCase !== undefined) {
        specialCase.handle(sb, expr, optionsIn);

        return;
      }
    }

    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    // [argsarr]
    sb.emitHelper(expr, options, sb.helpers.args);

    if (tsUtils.guards.isSuperExpression(func)) {
      this.handleSuperConstruct(sb, expr, options);

      return;
    }

    let bindThis;
    if (ts.isElementAccessExpression(func) || ts.isPropertyAccessExpression(func)) {
      bindThis = true;

      const lhs = tsUtils.expression.getExpression(func);
      if (tsUtils.guards.isSuperExpression(lhs)) {
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

      if (ts.isElementAccessExpression(func)) {
        // [objectVal, expr, argsarr]
        sb.emitHelper(func, options, sb.helpers.elementAccess);
      } else {
        const nameNode = tsUtils.node.getNameNode(func);
        // [name, expr, expr, argsarr]
        sb.emitPushString(nameNode, tsUtils.node.getName(func));
        // [objectVal, expr, argsarr]
        sb.emitHelper(nameNode, options, sb.helpers.getPropertyObjectProperty);
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

  private handleSysCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    const sysCallName = tsUtils.expression.getArguments(node)[0] as ts.Expression | undefined;

    const reportError = () => {
      sb.reportError(
        node,
        'First argument to syscall must be a string literal corresponding to a NEO syscall.',
        DiagnosticCode.INVALID_SYS_CALL,
      );
    };
    if (sysCallName === undefined || !ts.isStringLiteral(sysCallName)) {
      reportError();

      return;
    }

    const sysCallKey = tsUtils.literal.getLiteralValue(sysCallName) as keyof typeof SYSCALLS;
    const sysCall = SYSCALLS[sysCallKey] as typeof SYSCALLS[keyof typeof SYSCALLS] | undefined;
    if (sysCall === undefined) {
      reportError();
    } else {
      sysCall.handleCall(sb, node, options);
    }
  }

  private handleSuperConstruct(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
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
