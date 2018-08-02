import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

// [arrayVal]
export class ArrayBindingPatternCompiler extends NodeCompiler<ts.ArrayBindingPattern> {
  public readonly kind = ts.SyntaxKind.ArrayBindingPattern;

  public visitNode(sb: ScriptBuilder, node: ts.ArrayBindingPattern, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const restElement = node.elements.find((element) => tsUtils.node.getDotDotDotToken(element) !== undefined);
    const elements = restElement === undefined ? [...node.elements] : node.elements.slice(0, -1);
    elements.forEach((element, idx) => {
      if (ts.isOmittedExpression(element)) {
        /* istanbul ignore next */
        return;
      }

      const name = tsUtils.node.getNameNode(element);
      const initializer = tsUtils.initializer.getInitializer(element);

      if (ts.isIdentifier(name)) {
        sb.scope.add(tsUtils.node.getText(name));
      }

      // [arrayVal, arrayVal]
      sb.emitOp(element, 'DUP');
      // [number, arrayVal, arrayVal]
      sb.emitPushInt(element, idx);
      // [val, arrayVal]
      sb.emitHelper(node, options, sb.helpers.getArrayIndex);

      if (initializer !== undefined) {
        sb.emitHelper(
          node,
          options,
          sb.helpers.if({
            condition: () => {
              // [val, val, arrayVal]
              sb.emitOp(node, 'DUP');
              // [boolean, val, arrayVal]
              sb.emitHelper(node, options, sb.helpers.isUndefined);
            },
            whenTrue: () => {
              // [arrayVal]
              sb.emitOp(node, 'DROP');
              // [val, arrayVal]
              sb.visit(initializer, options);
            },
          }),
        );
      }

      if (ts.isIdentifier(name)) {
        // [arrayVal]
        sb.scope.set(sb, node, options, tsUtils.node.getText(name));
      } else {
        // [arrayVal]
        sb.visit(name, optionsIn);
      }
    });

    if (restElement === undefined) {
      // []
      sb.emitOp(node, 'DROP');
    } else {
      sb.scope.add(tsUtils.node.getNameOrThrow(restElement));

      // [arr]
      sb.emitHelper(node, options, sb.helpers.unwrapArray);
      // [number, arr]
      sb.emitPushInt(node, elements.length);
      // [arr]
      sb.emitHelper(node, options, sb.helpers.arrSlice({ hasEnd: false }));
      // [arrayVal]
      sb.emitHelper(node, options, sb.helpers.wrapArray);
      // []
      sb.scope.set(sb, node, options, tsUtils.node.getNameOrThrow(restElement));
    }
  }
}
