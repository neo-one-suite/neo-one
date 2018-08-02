import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Types } from '../helper/types/Types';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeOfExpressionCompiler extends NodeCompiler<ts.TypeOfExpression> {
  public readonly kind = ts.SyntaxKind.TypeOfExpression;

  public visitNode(sb: ScriptBuilder, node: ts.TypeOfExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    // [expr]
    sb.visit(tsUtils.expression.getExpression(node), options);
    // [number]
    sb.emitHelper(node, options, sb.helpers.unwrapType);

    const condition = (value: Types) => () => {
      // [number, number]
      sb.emitOp(node, 'DUP');
      // [type, number, number]
      sb.emitPushInt(node, value);
      // [boolean, number]
      sb.emitOp(node, 'NUMEQUAL');
    };

    const whenTrue = (value: string) => () => {
      // []
      sb.emitOp(node, 'DROP');
      // [string]
      sb.emitPushString(node, value);
    };

    const createCase = (type: Types, value: string) => ({
      condition: condition(type),
      whenTrue: whenTrue(value),
    });

    sb.emitHelper(
      node,
      options,
      sb.helpers.case(
        [
          createCase(Types.Undefined, 'undefined'),
          createCase(Types.Null, 'null'),
          createCase(Types.Boolean, 'boolean'),
          createCase(Types.String, 'string'),
          createCase(Types.Symbol, 'symbol'),
          createCase(Types.Number, 'number'),
          createCase(Types.Object, 'object'),
        ],
        () => {
          sb.emitOp(node, 'THROW');
        },
      ),
    );

    // [val]
    sb.emitHelper(node, options, sb.helpers.createString);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
