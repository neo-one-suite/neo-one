import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class TypeOfExpressionCompiler extends NodeCompiler<ts.TypeOfExpression> {
  public readonly kind = ts.SyntaxKind.TypeOfExpression;

  public visitNode(sb: ScriptBuilder, node: ts.TypeOfExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const expr = tsUtils.expression.getExpression(node);
    const createPushString = (value: string) => () => {
      sb.emitOp(node, 'DROP');
      sb.emitPushString(node, value);
    };

    const pushObject = createPushString('object');

    // [expr]
    sb.visit(expr, options);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: sb.context.analysis.getType(expr),
        array: pushObject,
        arrayStorage: pushObject,
        boolean: createPushString('boolean'),
        buffer: pushObject,
        null: createPushString('null'),
        number: createPushString('number'),
        object: pushObject,
        string: createPushString('string'),
        symbol: createPushString('symbol'),
        undefined: createPushString('undefined'),
        map: pushObject,
        mapStorage: pushObject,
        set: pushObject,
        setStorage: pushObject,
        error: pushObject,
        forwardValue: pushObject,
        iteratorResult: pushObject,
        iterable: pushObject,
        iterableIterator: pushObject,
        transaction: pushObject,
        attribute: pushObject,
        contract: pushObject,
        block: pushObject,
        contractManifest: pushObject,
        contractABI: pushObject,
        contractMethod: pushObject,
        contractEvent: pushObject,
        contractParameter: pushObject,
        contractGroup: pushObject,
        contractPermission: pushObject,
        transfer: pushObject,
      }),
    );
    // [val]
    sb.emitHelper(node, options, sb.helpers.wrapString);

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
