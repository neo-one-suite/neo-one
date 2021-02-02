import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ArrayEntries } from '../builtins/array/entries';
import { Types } from '../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ForOfStatementCompiler extends NodeCompiler<ts.ForOfStatement> {
  public readonly kind = ts.SyntaxKind.ForOfStatement;

  public visitNode(sb: ScriptBuilder, node: ts.ForOfStatement, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const initializer = tsUtils.statement.getInitializer(node);
    if (!ts.isVariableDeclarationList(initializer)) {
      /* istanbul ignore next */
      sb.context.reportUnsupported(initializer);

      /* istanbul ignore next */
      return;
    }

    const variables = tsUtils.variable.getDeclarations(initializer);
    if (variables.length !== 1) {
      /* istanbul ignore next */
      sb.context.reportUnsupported(initializer);

      /* istanbul ignore next */
      return;
    }

    const variable = variables[0];
    const nameNode = tsUtils.node.getNameNode(variable);
    const variableType = sb.context.analysis.getType(nameNode);
    const expression = tsUtils.expression.getExpression(node);
    const statement = tsUtils.statement.getStatement(node);

    const each = (innerOptions: VisitOptions) => {
      if (ts.isIdentifier(nameNode)) {
        sb.scope.add(tsUtils.node.getText(nameNode));
        sb.scope.set(sb, nameNode, innerOptions, tsUtils.node.getText(nameNode));
      } else if (ts.isArrayBindingPattern(nameNode)) {
        sb.emitHelper(nameNode, innerOptions, sb.helpers.arrayBinding({ type: variableType }));
      } else {
        sb.emitHelper(nameNode, innerOptions, sb.helpers.objectBinding({ type: variableType }));
      }
      sb.visit(statement, sb.noPushValueOptions(innerOptions));
    };

    const handleOther = (innerOptions: VisitOptions) => {
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
    };

    const handleArray = (innerOptions: VisitOptions, withIndex = false, arrEach = each) => {
      // [arr]
      sb.emitHelper(expression, innerOptions, sb.helpers.unwrapArray);
      // []
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.arrForEach({
          withIndex,
          each: arrEach,
        }),
      );
    };

    const handleArrayStorage = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        sb.noPushValueOptions(innerOptions),
        sb.helpers.forEachValStructuredStorage({
          type: Types.ArrayStorage,
          each,
        }),
      );
    };

    const handleMap = (innerOptions: VisitOptions) => {
      // [map]
      sb.emitHelper(expression, innerOptions, sb.helpers.unwrapMap);
      // [iterator]
      sb.emitSysCall(expression, 'System.Iterator.Create');
      // []
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.rawIteratorForEach({
          deserializeKey: true,
          each: (innerInnerOptionsIn) => {
            const innerInnerOptions = sb.pushValueOptions(innerInnerOptionsIn);
            // [2, key, val]
            sb.emitPushInt(node, 2);
            // [arr]
            sb.emitOp(node, 'PACK');
            // [val]
            sb.emitHelper(node, innerInnerOptions, sb.helpers.wrapArray);
            // []
            each(innerInnerOptions);
          },
        }),
      );
    };

    const handleMapStorage = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        sb.noPushValueOptions(innerOptions),
        sb.helpers.forEachStructuredStorage({
          type: Types.MapStorage,
          each: (innerInnerOptionsIn) => {
            const innerInnerOptions = sb.pushValueOptions(innerInnerOptionsIn);
            // [number, keyVal, valueVal]
            sb.emitPushInt(node, 2);
            // [arr]
            sb.emitOp(node, 'PACK');
            // [val]
            sb.emitHelper(node, innerInnerOptions, sb.helpers.wrapArray);
            // []
            each(innerInnerOptions);
          },
        }),
      );
    };

    const handleSet = (innerOptions: VisitOptions) => {
      // [map]
      sb.emitHelper(expression, innerOptions, sb.helpers.unwrapSet);
      // [iterator]
      sb.emitSysCall(expression, 'System.Iterator.Create');
      // []
      sb.emitHelper(node, innerOptions, sb.helpers.rawIteratorForEachKey({ each, deserializeKey: true }));
    };

    const handleSetStorage = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        sb.noPushValueOptions(innerOptions),
        sb.helpers.forEachKeyStructuredStorage({
          type: Types.SetStorage,
          each,
        }),
      );
    };

    const handleIterableIterator = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        sb.noPushValueOptions(innerOptions),
        sb.helpers.iterableIteratorForEach({
          each,
        }),
      );
    };

    const handleIterable = (innerOptions: VisitOptions) => {
      sb.emitHelper(
        node,
        innerOptions,
        sb.helpers.forIterableType({
          array: handleArray,
          map: handleMap,
          set: handleSet,
          arrayStorage: handleArrayStorage,
          mapStorage: handleMapStorage,
          setStorage: handleSetStorage,
          iterableIterator: handleIterableIterator,
          defaultCase: handleOther,
        }),
      );
    };

    if (ts.isCallExpression(expression)) {
      const valueExpression = tsUtils.expression.getExpression(expression);
      if (ts.isPropertyAccessExpression(valueExpression)) {
        const value = tsUtils.expression.getExpression(valueExpression);
        const name = tsUtils.node.getNameNode(valueExpression);

        const builtinProp = sb.context.builtins.getMember(value, name);
        if (builtinProp !== undefined && builtinProp instanceof ArrayEntries) {
          // [val]
          sb.visit(value, options);
          handleArray(options, true, (innerOptions) => {
            // [idx, val]
            sb.emitOp(variable, 'SWAP');
            // [idxVal, val]
            sb.emitHelper(variable, sb.pushValueOptions(innerOptions), sb.helpers.wrapNumber);
            // [2, idxVal, val]
            sb.emitPushInt(variable, 2);
            // [arr]
            sb.emitOp(variable, 'PACK');
            // [arrayVal]
            sb.emitHelper(variable, sb.pushValueOptions(innerOptions), sb.helpers.wrapArray);
            // []
            each(innerOptions);
          });

          return;
        }
      }
    }

    // [val]
    sb.visit(expression, options);
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: sb.context.analysis.getType(expression),
        array: handleArray,
        arrayStorage: handleArrayStorage,
        boolean: handleOther,
        buffer: handleOther,
        null: handleOther,
        number: handleOther,
        object: handleOther,
        string: handleOther,
        symbol: handleOther,
        undefined: handleOther,
        map: handleMap,
        mapStorage: handleMapStorage,
        set: handleSet,
        setStorage: handleSetStorage,
        error: handleOther,
        forwardValue: handleOther,
        iteratorResult: handleOther,
        iterable: handleIterable,
        iterableIterator: handleIterableIterator,
        transaction: handleOther,
        attribute: handleOther,
        contract: handleOther,
        block: handleOther,
      }),
    );
  }
}
