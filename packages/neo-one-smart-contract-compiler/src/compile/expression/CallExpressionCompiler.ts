import { ABIReturn } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../DiagnosticCode';
import { toABIReturn } from '../../utils';
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

const consoleLog: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'consoleLog'),
  handle: (sb, node, optionsIn) => {
    const options = sb.pushValueOptions(optionsIn);

    const emitABIReturn = (abiReturn: ABIReturn, arg: ts.Expression): number => {
      switch (abiReturn.type) {
        case 'Signature':
        case 'Hash160':
        case 'Hash256':
        case 'PublicKey':
        case 'ByteArray':
        case 'String':
        case 'Integer':
        case 'Boolean':
          // [val]
          sb.visit(arg, options);
          // tslint:disable-next-line prefer-switch
          if (abiReturn.type === 'String' || abiReturn.type === 'Integer' || abiReturn.type === 'Boolean') {
            // [value]
            sb.emitHelper(arg, options, sb.helpers.unwrapVal);
          } else {
            sb.emitHelper(arg, options, sb.helpers.unwrapBuffer);
          }
          // [type, value]
          sb.emitPushString(arg, abiReturn.type);
          // [2, type, value]
          sb.emitPushInt(arg, 2);
          // [[type, value]]
          sb.emitOp(arg, 'PACK');

          return 1;
        case 'Array':
        case 'Void':
        case 'InteropInterface':
          sb.reportUnsupported(arg);

          return 0;
        default:
          utils.assertNever(abiReturn);
          sb.reportUnsupported(arg);

          return 0;
      }
    };

    const encodeValue = (arg: ts.Expression): number => {
      const type = sb.getType(arg, { error: true });
      if (type === undefined) {
        return 0;
      }

      const abiReturn = toABIReturn(sb.context, arg, type);
      if (abiReturn === undefined) {
        sb.reportUnsupported(arg);

        return 0;
      }

      return emitABIReturn(abiReturn, arg);
    };

    const args = tsUtils.argumented.getArguments(node);
    const argsLength = args.reduce((acc, arg) => acc + encodeValue(arg), 0);
    // [length, ...arr]
    sb.emitPushInt(node, argsLength);
    // [arr]
    sb.emitOp(node, 'PACK');
    // [line, arr]
    sb.emitLine(node);
    // ['console.log', line, arr]
    sb.emitPushString(node, 'console.log');
    // [length, 'console.log', line, arr]
    sb.emitPushInt(node, 3);
    // [arr]
    sb.emitOp(node, 'PACK');
    // []
    sb.emitSysCall(node, 'Neo.Runtime.Notify');
  },
};

const symbolFor: SpecialCase = {
  test: (sb, node, symbol) => sb.isGlobalSymbol(node, symbol, 'SymbolFor'),
  handle: (sb, node, optionsIn) => {
    const options = sb.pushValueOptions(optionsIn);
    const args = tsUtils.argumented.getArguments(node);
    // [stringVal]
    sb.visit(args[0], options);
    if (optionsIn.pushValue) {
      // [string]
      sb.emitHelper(node, options, sb.helpers.toString({ type: sb.getType(args[0]) }));
      // [symbolVal]
      sb.emitHelper(node, options, sb.helpers.createSymbol);
    } else {
      sb.emitOp(node, 'DROP');
    }
  },
};

const CASES: ReadonlyArray<SpecialCase> = [bufferFrom, bufferEquals, consoleLog, symbolFor];

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
