import { tsUtils } from '@neo-one/ts-utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { isBuiltInCall } from '../../builtins';
import { ScriptBuilder } from '../../sb';
import { SYSCALLS } from '../../syscalls';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

export class CallLikeHelper extends Helper<ts.CallExpression | ts.TaggedTemplateExpression> {
  public emit(sb: ScriptBuilder, expr: ts.CallExpression | ts.TaggedTemplateExpression, optionsIn: VisitOptions): void {
    const func = ts.isCallExpression(expr) ? tsUtils.expression.getExpression(expr) : tsUtils.template.getTag(expr);
    const symbol = sb.getSymbol(func, { warning: false });
    if (ts.isIdentifier(func) && sb.isGlobalSymbol(func, symbol, 'syscall')) {
      if (!ts.isCallExpression(expr)) {
        sb.reportUnsupported(expr);

        return;
      }

      this.handleSysCall(sb, expr, optionsIn);

      return;
    }

    if (symbol !== undefined) {
      const builtin = sb.builtIns.get(symbol);
      // We would have reported an error if this was an invalid extend of a builtin.
      if (builtin !== undefined && !tsUtils.guards.isSuperExpression(func)) {
        if (!isBuiltInCall(builtin) || !ts.isCallExpression(expr)) {
          sb.reportUnsupported(expr);

          return;
        }

        builtin.emitCall(sb, expr, optionsIn);

        return;
      }
    }

    const options = sb.pushValueOptions(sb.noCastOptions(optionsIn));
    if (ts.isCallExpression(expr)) {
      // [argsarr]
      sb.emitHelper(expr, options, sb.helpers.args);
    } else {
      const template = tsUtils.template.getTemplate(expr);
      if (ts.isNoSubstitutionTemplateLiteral(template)) {
        // [0]
        sb.emitPushInt(template, 0);
        // [literalsArr]
        sb.emitOp(template, 'NEWARRAY');
        // [literalsArr, literalsArr]
        sb.emitOp(template, 'DUP');
        // [stringVal]
        sb.visit(template, options);
        // [literalsArr]
        sb.emitOp(template, 'APPEND');
        // [literalsArrayVal]
        sb.emitHelper(template, options, sb.helpers.wrapArray);
        // [vals.length + 1, literalsArrayVal]
        sb.emitPushInt(template, 1);
        // [argsarr]
        sb.emitOp(template, 'PACK');
      } else {
        const head = tsUtils.template.getTemplateHead(template);
        _.reverse([...tsUtils.template.getTemplateSpans(template)]).forEach((span) => {
          // [val]
          sb.visit(tsUtils.expression.getExpression(span), options);
        });

        // [0]
        sb.emitPushInt(template, 0);
        // [literalsArr]
        sb.emitOp(template, 'NEWARRAY');
        // [literalsArr, literalsArr]
        sb.emitOp(template, 'DUP');
        // [string, literalsArr, literalsArr]
        sb.emitPushString(head, tsUtils.literal.getLiteralValue(head));
        // [stringVal, literalsArr, literalsArr]
        sb.emitHelper(head, options, sb.helpers.createString);
        // [literalsArr]
        sb.emitOp(head, 'APPEND');
        tsUtils.template.getTemplateSpans(template).forEach((span) => {
          const spanLiteral = tsUtils.template.getLiteral(span);
          // [string, literalsArr, literalsArr]
          sb.emitOp(spanLiteral, 'DUP');
          // [string, literalsArr, literalsArr]
          sb.emitPushString(spanLiteral, tsUtils.literal.getLiteralValue(spanLiteral));
          // [stringVal, literalsArr, literalsArr]
          sb.emitHelper(head, options, sb.helpers.createString);
          // [literalsArr]
          sb.emitOp(expr, 'APPEND');
        });
        // [literalsArrayVal]
        sb.emitHelper(template, options, sb.helpers.wrapArray);
        // [vals.length + 1, literalsArrayVal]
        sb.emitPushInt(template, tsUtils.template.getTemplateSpans(template).length + 1);
        // [argsarr]
        sb.emitOp(template, 'PACK');
      }
    }

    if (ts.isCallExpression(expr) && tsUtils.guards.isSuperExpression(func)) {
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

    sb.emitHelper(expr, sb.noCastOptions(optionsIn), sb.helpers.invokeCall({ bindThis }));
  }

  private handleSysCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    const sysCallName = tsUtils.expression.getArguments(node)[0];

    const reportError = () => {
      sb.reportError(sysCallName, DiagnosticCode.InvalidSyscall, DiagnosticMessage.InvalidSyscall);
    };
    if (!ts.isStringLiteral(sysCallName)) {
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
    sb.emitHelper(node, sb.noPushValueOptions(options), sb.helpers.invokeConstruct());
  }
}
