import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { TypedHelper, TypedHelperOptions } from '../types';

export interface ArrayBindingHelperOptions extends TypedHelperOptions {
  readonly value?: ts.Node;
}

// [arrayVal]
export class ArrayBindingHelper extends TypedHelper<ts.ArrayBindingPattern> {
  private readonly value?: ts.Node;

  public constructor(options: ArrayBindingHelperOptions) {
    super(options);
    this.value = options.value;
  }

  public emit(sb: ScriptBuilder, node: ts.ArrayBindingPattern, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    const restElement = node.elements.find((element) => tsUtils.node.getDotDotDotToken(element) !== undefined);
    const elements = restElement === undefined ? [...node.elements] : node.elements.slice(0, -1);

    const handleCommon = (
      setup: (innerOptions: VisitOptions) => void,
      getNext: (node: ts.Node, innerOptions: VisitOptions, idx: number) => void,
      getRemaining: (node: ts.Node, innerOptions: VisitOptions) => void,
    ) => (innerOptions: VisitOptions) => {
      setup(innerOptions);

      elements.forEach((element, idx) => {
        if (ts.isOmittedExpression(element)) {
          /* istanbul ignore next */
          return;
        }

        const name = tsUtils.node.getNameNode(element);
        const initializer = tsUtils.initializer.getInitializer(element);
        const elementType = sb.context.analysis.getType(name);

        if (ts.isIdentifier(name)) {
          sb.scope.add(tsUtils.node.getText(name));
        }

        // [arrayVal, arrayVal]
        sb.emitOp(element, 'DUP');
        // [val, arrayVal]
        getNext(element, innerOptions, idx);

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
        } else if (ts.isArrayBindingPattern(name)) {
          sb.emitHelper(name, options, sb.helpers.arrayBinding({ type: elementType }));
        } else {
          sb.emitHelper(name, options, sb.helpers.objectBinding({ type: elementType }));
        }
      });

      if (restElement === undefined) {
        // []
        sb.emitOp(node, 'DROP');
      } else {
        sb.scope.add(tsUtils.node.getNameOrThrow(restElement));

        // [arr]
        getRemaining(restElement, innerOptions);
        // [arrayVal]
        sb.emitHelper(node, options, sb.helpers.wrapArray);
        // []
        sb.scope.set(sb, node, options, tsUtils.node.getNameOrThrow(restElement));
      }
    };

    const handleArray = handleCommon(
      () => {
        // do nothing
      },
      (element, innerOptions, idx) => {
        sb.emitPushInt(element, idx);
        sb.emitHelper(element, innerOptions, sb.helpers.getArrayIndex);
      },
      (element, innerOptions) => {
        // [arr]
        sb.emitHelper(element, innerOptions, sb.helpers.unwrapArray);
        // [number, arr]
        sb.emitPushInt(element, elements.length);
        // [arr]
        sb.emitHelper(element, innerOptions, sb.helpers.arrSlice({ hasEnd: false }));
      },
    );

    const handleMapLike = (element: ts.Node) => (innerOption: VisitOptions) => {
      // [value, arrOut, key]
      sb.emitOp(element, 'ROT');
      // [key, value, arrOut]
      sb.emitOp(element, 'ROT');
      // [2, key, value, arrOut]
      sb.emitPushInt(element, 2);
      // [arr, arrOut]
      sb.emitOp(element, 'PACK');
      // [val, arrOut]
      sb.emitHelper(element, innerOption, sb.helpers.wrapArray);
      // [arrOut, val, arrOut]
      sb.emitOp(element, 'OVER');
      // [val, arrOut, arrOut]
      sb.emitOp(element, 'SWAP');
      // [arrOut]
      sb.emitOp(element, 'APPEND');
    };

    const handleMap = handleCommon(
      (innerOptions) => {
        // [map]
        sb.emitHelper(node, innerOptions, sb.helpers.unwrapMap);
        // [iterator]
        sb.emitSysCall(node, 'Neo.Iterator.Create');
      },
      (element, innerOptions) => {
        // [iterator, iterator]
        sb.emitOp(element, 'DUP');
        // [boolean, iterator]
        sb.emitSysCall(element, 'Neo.Enumerator.Next');
        // [iterator]
        sb.emitOp(element, 'DROP');
        // [iterator, iterator]
        sb.emitOp(element, 'DUP');
        // [val, iterator]
        sb.emitSysCall(element, 'Neo.Enumerator.Value');
        // [iterator, val]
        sb.emitOp(element, 'SWAP');
        // [key, val]
        sb.emitSysCall(element, 'Neo.Iterator.Key');
        // [key, val]
        sb.emitSysCall(element, 'Neo.Runtime.Deserialize');
        // [2, key, val]
        sb.emitPushInt(element, 2);
        // [arr]
        sb.emitOp(element, 'PACK');
        // [val]
        sb.emitHelper(element, innerOptions, sb.helpers.wrapArray);
      },
      (element, innerOptions) => {
        // [0, iterator]
        sb.emitPushInt(element, 0);
        // [arr, iterator]
        sb.emitOp(element, 'NEWARRAY');
        // [arr]
        sb.emitHelper(
          element,
          innerOptions,
          sb.helpers.rawIteratorReduce({
            deserializeKey: true,
            each: handleMapLike(element),
          }),
        );
      },
    );

    const handleSetLike = (element: ts.Node) => () => {
      // [value, arrOut, key]
      sb.emitOp(element, 'ROT');
      // [arrOut, key]
      sb.emitOp(element, 'DROP');
      // [arrOut, key, arrOut]
      sb.emitOp(element, 'TUCK');
      // [key, arrOut, arrOut]
      sb.emitOp(element, 'SWAP');
      // [arrOut]
      sb.emitOp(element, 'APPEND');
    };

    const handleSet = handleCommon(
      (innerOptions) => {
        // [map]
        sb.emitHelper(node, innerOptions, sb.helpers.unwrapSet);
        // [iterator]
        sb.emitSysCall(node, 'Neo.Iterator.Create');
      },
      (element) => {
        // [iterator, iterator]
        sb.emitOp(element, 'DUP');
        // [boolean, iterator]
        sb.emitSysCall(element, 'Neo.Enumerator.Next');
        // [iterator]
        sb.emitOp(element, 'DROP');
        // [val]
        sb.emitSysCall(element, 'Neo.Iterator.Key');
        // [val]
        sb.emitSysCall(element, 'Neo.Runtime.Deserialize');
      },
      (element, innerOptions) => {
        // [0, iterator]
        sb.emitPushInt(element, 0);
        // [arr, iterator]
        sb.emitOp(element, 'NEWARRAY');
        // [arr]
        sb.emitHelper(
          element,
          innerOptions,
          sb.helpers.rawIteratorReduce({
            deserializeKey: true,
            each: handleSetLike(element),
          }),
        );
      },
    );

    const handleUnsupported = () => {
      sb.context.reportUnsupported(node);
    };

    if (this.value !== undefined) {
      // [val]
      sb.visit(this.value, options);
    }
    sb.emitHelper(
      node,
      options,
      sb.helpers.forIterableType({
        type: this.type,
        array: handleArray,
        map: handleMap,
        set: handleSet,
        arrayStorage: handleUnsupported,
        mapStorage: handleUnsupported,
        setStorage: handleUnsupported,
        iterableIterator: handleUnsupported,
      }),
    );
  }
}
