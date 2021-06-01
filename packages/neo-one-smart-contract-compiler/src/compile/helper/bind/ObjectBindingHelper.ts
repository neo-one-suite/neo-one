import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { DiagnosticCode } from '../../../DiagnosticCode';
import { DiagnosticMessage } from '../../../DiagnosticMessage';
import { Builtin, isBuiltinInstanceMemberValue, isBuiltinMemberValue } from '../../builtins';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { TypedHelper, TypedHelperOptions } from '../types';

export interface ObjectBindingHelperOptions extends TypedHelperOptions {
  readonly value?: ts.Node;
}

// Input: [val?]
// Output: []
export class ObjectBindingHelper extends TypedHelper<ts.ObjectBindingPattern> {
  private readonly value?: ts.Node;

  public constructor(options: ObjectBindingHelperOptions) {
    super(options);
    this.value = options.value;
  }

  public emit(sb: ScriptBuilder, node: ts.ObjectBindingPattern, optionsIn: VisitOptions): void {
    const restElement = node.elements.find((element) => tsUtils.node.getDotDotDotToken(element) !== undefined);
    const elements = restElement === undefined ? [...node.elements] : node.elements.slice(0, -1);

    const throwTypeError = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(node, 'DROP');
      sb.emitHelper(node, innerOptions, sb.helpers.throwTypeError);
    };

    const throwInnerTypeError = (innerOptions: VisitOptions) => {
      // []
      sb.emitOp(node, 'DROP');
      throwTypeError(innerOptions);
    };

    const handleBuiltin = (member: Builtin, element: ts.BindingElement, innerOptions: VisitOptions) => {
      if (isBuiltinInstanceMemberValue(member)) {
        member.emitValue(sb, element, innerOptions, true);

        return;
      }

      if (isBuiltinMemberValue(member)) {
        member.emitValue(sb, element, innerOptions);

        return;
      }

      sb.context.reportError(
        element,
        DiagnosticCode.InvalidBuiltinReference,
        DiagnosticMessage.CannotReferenceBuiltinProperty,
      );
    };

    const createProcessBuiltin =
      (builtinName: string, isBuiltinValue = false) =>
      (innerOptions: VisitOptions) => {
        if (restElement !== undefined) {
          sb.context.reportUnsupportedEfficiency(restElement);
        }

        elements.forEach((element) => {
          const nameNode = tsUtils.node.getNameNode(element);
          const propertyName = tsUtils.node.getPropertyNameNode(element);
          const initializer = tsUtils.initializer.getInitializer(element);
          const elementType = sb.context.analysis.getType(nameNode);

          if (ts.isIdentifier(nameNode)) {
            sb.scope.add(tsUtils.node.getText(nameNode));
          }

          if (!isBuiltinValue) {
            // [objectVal, objectVal]
            sb.emitOp(element, 'DUP');
          }

          if (
            propertyName === undefined ||
            ts.isIdentifier(propertyName) ||
            ts.isStringLiteral(propertyName) ||
            ts.isNumericLiteral(propertyName)
          ) {
            const memberName =
              propertyName === undefined
                ? tsUtils.node.getNameOrThrow(element)
                : ts.isIdentifier(propertyName)
                ? tsUtils.node.getText(propertyName)
                : ts.isStringLiteral(propertyName)
                ? tsUtils.literal.getLiteralValue(propertyName)
                : `${tsUtils.literal.getLiteralValue(propertyName)}`;
            const member = sb.context.builtins.getOnlyMember(builtinName, memberName);

            if (member === undefined) {
              throwInnerTypeError(innerOptions);
            } else {
              handleBuiltin(member, element, innerOptions);
            }
          } else {
            sb.context.reportUnsupported(element);
          }

          if (initializer !== undefined) {
            sb.emitHelper(
              node,
              innerOptions,
              sb.helpers.if({
                condition: () => {
                  // [val, val, objectVal]
                  sb.emitOp(node, 'DUP');
                  // [boolean, val, objectVal]
                  sb.emitHelper(node, innerOptions, sb.helpers.isUndefined);
                },
                whenTrue: () => {
                  // [objectVal]
                  sb.emitOp(node, 'DROP');
                  // [val, objectVal]
                  sb.visit(initializer, innerOptions);
                },
              }),
            );
          }

          if (ts.isIdentifier(nameNode)) {
            // [objectVal]
            sb.scope.set(sb, element, innerOptions, tsUtils.node.getText(nameNode));
          } else if (ts.isArrayBindingPattern(nameNode)) {
            sb.emitHelper(nameNode, innerOptions, sb.helpers.arrayBinding({ type: elementType }));
          } else {
            sb.emitHelper(nameNode, innerOptions, sb.helpers.objectBinding({ type: elementType }));
          }
        });

        if (!isBuiltinValue) {
          sb.emitOp(node, 'DROP');
        }
      };

    const processObject = (innerOptions: VisitOptions) => {
      let addSymbolProp = () => {
        // do nothing
      };
      let addStringProp = () => {
        // do nothing
      };
      if (restElement !== undefined) {
        // [symbolArr]
        sb.emitOp(node, 'NEWARRAY0');
        // [propertyArr, symbolArr]
        sb.emitOp(node, 'NEWARRAY0');
        // [objectVal, propertyArr, symbolArr]
        sb.emitOp(node, 'ROT');
        addSymbolProp = () => {
          // [4, val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitPushInt(restElement, 4);
          // [symbolArr, val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitOp(restElement, 'PICK');
          // [val, symbolArr, val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitOp(node, 'OVER');
          // [val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitOp(node, 'APPEND');
        };
        addStringProp = () => {
          // [3, val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitPushInt(restElement, 3);
          // [propertyArr, val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitOp(restElement, 'PICK');
          // [val, propertyArr, val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitOp(node, 'OVER');
          // [val, objectVal, objectVal, propertyArr, symbolArr]
          sb.emitOp(node, 'APPEND');
        };
      }

      elements.forEach((element) => {
        const nameNode = tsUtils.node.getNameNode(element);
        const propertyName = tsUtils.node.getPropertyNameNode(element);
        const initializer = tsUtils.initializer.getInitializer(element);
        const elementType = sb.context.analysis.getType(nameNode);

        if (ts.isIdentifier(nameNode)) {
          sb.scope.add(tsUtils.node.getText(nameNode));
        }

        // [objectVal, objectVal]
        sb.emitOp(element, 'DUP');
        if (propertyName === undefined) {
          // [string, objectVal, objectVal]
          sb.emitPushString(element, tsUtils.node.getNameOrThrow(element));
          addStringProp();
          // [val, objectVal]
          sb.emitHelper(element, innerOptions, sb.helpers.getPropertyObjectProperty);
        } else if (ts.isIdentifier(propertyName)) {
          // [string, objectVal, objectVal]
          sb.emitPushString(element, tsUtils.node.getText(propertyName));
          addStringProp();
          // [val, objectVal]
          sb.emitHelper(element, innerOptions, sb.helpers.getPropertyObjectProperty);
        } else if (ts.isComputedPropertyName(propertyName)) {
          const expr = tsUtils.expression.getExpression(propertyName);
          const propertyNameType = sb.context.analysis.getType(expr);

          // [propVal, objectVal, objectVal]
          sb.visit(expr, innerOptions);

          const handleSymbol = () => {
            // [string, objectVal, objectVal]
            sb.emitHelper(element, innerOptions, sb.helpers.unwrapSymbol);
            addSymbolProp();
            // [val, objectVal]
            sb.emitHelper(element, innerOptions, sb.helpers.getSymbolObjectProperty);
          };

          const handleStringBase = (innerInnerOptions: VisitOptions) => {
            addStringProp();
            // [val, objectVal]
            sb.emitHelper(element, innerInnerOptions, sb.helpers.getPropertyObjectProperty);
          };

          const handleString = (innerInnerOptions: VisitOptions) => {
            // [string, objectVal, objectVal]
            sb.emitHelper(node, innerInnerOptions, sb.helpers.unwrapString);
            handleStringBase(innerInnerOptions);
          };

          const handleNumber = (innerInnerOptions: VisitOptions) => {
            // [string, objectVal, objectVal]
            sb.emitHelper(node, innerInnerOptions, sb.helpers.toString({ type: propertyNameType }));
            handleStringBase(innerInnerOptions);
          };

          sb.emitHelper(
            element,
            innerOptions,
            sb.helpers.forBuiltinType({
              type: propertyNameType,
              array: throwInnerTypeError,
              arrayStorage: throwInnerTypeError,
              boolean: throwInnerTypeError,
              buffer: throwInnerTypeError,
              null: throwInnerTypeError,
              number: handleNumber,
              object: throwInnerTypeError,
              string: handleString,
              symbol: handleSymbol,
              undefined: throwInnerTypeError,
              map: throwInnerTypeError,
              mapStorage: throwInnerTypeError,
              set: throwInnerTypeError,
              setStorage: throwInnerTypeError,
              error: throwInnerTypeError,
              forwardValue: throwInnerTypeError,
              iteratorResult: throwInnerTypeError,
              iterable: throwInnerTypeError,
              iterableIterator: throwInnerTypeError,
              transaction: throwInnerTypeError,
              attribute: throwInnerTypeError,
              contract: throwInnerTypeError,
              block: throwInnerTypeError,
              contractManifest: throwInnerTypeError,
              contractABI: throwInnerTypeError,
              contractMethod: throwInnerTypeError,
              contractEvent: throwInnerTypeError,
              contractParameter: throwInnerTypeError,
              contractGroup: throwInnerTypeError,
              contractPermission: throwInnerTypeError,
            }),
          );
        } else {
          // [string, objectVal, objectVal]
          sb.emitPushString(
            propertyName,
            ts.isStringLiteral(propertyName)
              ? tsUtils.literal.getLiteralValue(propertyName)
              : `${tsUtils.literal.getLiteralValue(propertyName)}`,
          );
          addStringProp();
          // [val, objectVal]
          sb.emitHelper(element, innerOptions, sb.helpers.getPropertyObjectProperty);
        }

        if (initializer !== undefined) {
          sb.emitHelper(
            node,
            innerOptions,
            sb.helpers.if({
              condition: () => {
                // [val, val, objectVal]
                sb.emitOp(node, 'DUP');
                // [boolean, val, objectVal]
                sb.emitHelper(node, innerOptions, sb.helpers.isUndefined);
              },
              whenTrue: () => {
                // [objectVal]
                sb.emitOp(node, 'DROP');
                // [val, objectVal]
                sb.visit(initializer, innerOptions);
              },
            }),
          );
        }

        if (ts.isIdentifier(nameNode)) {
          // [objectVal]
          sb.scope.set(sb, element, innerOptions, tsUtils.node.getText(nameNode));
        } else if (ts.isArrayBindingPattern(nameNode)) {
          sb.emitHelper(nameNode, innerOptions, sb.helpers.arrayBinding({ type: elementType }));
        } else {
          sb.emitHelper(nameNode, innerOptions, sb.helpers.objectBinding({ type: elementType }));
        }
      });

      if (restElement === undefined) {
        // []
        sb.emitOp(node, 'DROP');
      } else {
        const name = tsUtils.node.getNameOrThrow(restElement);
        sb.scope.add(name);

        // [iobj, objectVal, propertyArr, symbolArr]
        sb.emitOp(node, 'NEWMAP');
        // [objectVal, iobj, propertyArr, symbolArr]
        sb.emitOp(node, 'SWAP');
        // [objectVal, objectVal, iobj, propertyArr, symbolArr]
        sb.emitOp(node, 'DUP');
        // [sobj, objectVal, iobj, propertyArr, symbolArr]
        sb.emitHelper(node, innerOptions, sb.helpers.getSymbolObject);
        // [objectVal, sobj, iobj, propertyArr, symbolArr]
        sb.emitOp(node, 'SWAP');
        // [pobj, sobj, iobj, propertyArr, symbolArr]
        sb.emitHelper(node, innerOptions, sb.helpers.getPropertyObject);
        // [3, pobj, sobj, iobj, propertyArr, symbolArr]
        sb.emitPushInt(node, 3);
        // [obj, propertyArr, symbolArr]
        sb.emitHelper(node, innerOptions, sb.helpers.packObject);
        // [objectVal, objectVal, propertyArr, symbolArr]
        sb.emitOp(node, 'DUP');
        // [symbolArr, propertyArr, objectVal, objectVal]
        sb.emitOp(node, 'REVERSE4');
        // [objectVal, propertyArr, symbolArr, objectVal]
        sb.emitOp(node, 'REVERSE3');
        // [symbolArr, objectVal, propertyArr, objectVal]
        sb.emitOp(restElement, 'ROT');
        // [propertyArr, symbolArr, objectVal, objectVal]
        sb.emitOp(restElement, 'ROT');
        // [objectVal]
        sb.emitHelper(restElement, innerOptions, sb.helpers.omitObjectProperties);
        // []
        sb.scope.set(sb, restElement, innerOptions, name);
      }
    };

    const options = sb.pushValueOptions(optionsIn);
    if (this.value !== undefined) {
      const builtinInterface = sb.context.builtins.getValueInterface(this.value);
      if (builtinInterface === undefined) {
        sb.visit(this.value, options);
      } else {
        createProcessBuiltin(builtinInterface, true)(options);

        return;
      }
    }
    sb.emitHelper(
      node,
      options,
      sb.helpers.forBuiltinType({
        type: this.type,
        knownType: this.knownType,
        array: createProcessBuiltin('Array'),
        arrayStorage: createProcessBuiltin('ArrayStorage'),
        boolean: createProcessBuiltin('Boolean'),
        buffer: createProcessBuiltin('Buffer'),
        null: throwTypeError,
        number: createProcessBuiltin('Number'),
        object: processObject,
        string: createProcessBuiltin('String'),
        symbol: createProcessBuiltin('Symbol'),
        undefined: throwTypeError,
        map: createProcessBuiltin('Map'),
        mapStorage: createProcessBuiltin('MapStorage'),
        set: createProcessBuiltin('Set'),
        setStorage: createProcessBuiltin('SetStorage'),
        error: createProcessBuiltin('Error'),
        forwardValue: createProcessBuiltin('ForwardValue'),
        iteratorResult: createProcessBuiltin('IteratorResult'),
        iterable: createProcessBuiltin('Iterable'),
        iterableIterator: createProcessBuiltin('IterableIterator'),
        transaction: createProcessBuiltin('Transaction'),
        attribute: createProcessBuiltin('AttributeBase'),
        contract: createProcessBuiltin('Contract'),
        block: createProcessBuiltin('Block'),
        contractManifest: createProcessBuiltin('ContractManifest'),
        contractABI: createProcessBuiltin('ContractABI'),
        contractMethod: createProcessBuiltin('ContractMethodDescriptor'),
        contractEvent: createProcessBuiltin('ContractEventDescriptor'),
        contractParameter: createProcessBuiltin('ContractParameterDefinition'),
        contractGroup: createProcessBuiltin('ContractGroup'),
        contractPermission: createProcessBuiltin('ContractPermission'),
      }),
    );
  }
}
