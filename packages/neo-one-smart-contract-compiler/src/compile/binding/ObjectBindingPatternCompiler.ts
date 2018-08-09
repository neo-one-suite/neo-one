import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

// [objectVal]
export class ObjectBindingPatternCompiler extends NodeCompiler<ts.ObjectBindingPattern> {
  public readonly kind = ts.SyntaxKind.ObjectBindingPattern;

  public visitNode(sb: ScriptBuilder, node: ts.ObjectBindingPattern, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const restElement = node.elements.find((element) => tsUtils.node.getDotDotDotToken(element) !== undefined);
    let addSymbolProp = () => {
      // do nothing
    };
    let addStringProp = () => {
      // do nothing
    };
    if (restElement !== undefined) {
      // [0]
      sb.emitPushInt(node, 0);
      // [symbolArr]
      sb.emitOp(node, 'NEWARRAY');
      // [0]
      sb.emitPushInt(node, 0);
      // [propertyArr, symbolArr]
      sb.emitOp(node, 'NEWARRAY');
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

    const elements = restElement === undefined ? [...node.elements] : node.elements.slice(0, -1);
    elements.forEach((element) => {
      const nameNode = tsUtils.node.getNameNode(element);
      const propertyName = tsUtils.node.getPropertyNameNode(element);
      const initializer = tsUtils.initializer.getInitializer(element);

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
        sb.emitHelper(element, options, sb.helpers.getPropertyObjectProperty);
      } else if (ts.isIdentifier(propertyName)) {
        // [string, objectVal, objectVal]
        sb.emitPushString(element, tsUtils.node.getText(propertyName));
        addStringProp();
        // [val, objectVal]
        sb.emitHelper(element, options, sb.helpers.getPropertyObjectProperty);
      } else if (ts.isComputedPropertyName(propertyName)) {
        const expr = tsUtils.expression.getExpression(propertyName);
        const propertyNameType = sb.context.getType(expr);

        // [propVal, objectVal, objectVal]
        sb.visit(expr, options);

        const handleSymbol = () => {
          // [string, objectVal, objectVal]
          sb.emitHelper(element, options, sb.helpers.unwrapSymbol);
          addSymbolProp();
          // [val, objectVal]
          sb.emitHelper(element, options, sb.helpers.getSymbolObjectProperty);
        };

        const handleString = () => {
          // [string, objectVal, objectVal]
          sb.emitHelper(node, options, sb.helpers.toString({ type: propertyNameType }));
          addStringProp();
          // [val, objectVal]
          sb.emitHelper(element, options, sb.helpers.getPropertyObjectProperty);
        };

        if (
          propertyNameType === undefined ||
          (!tsUtils.type_.isOnlySymbolish(propertyNameType) && tsUtils.type_.hasSymbolish(propertyNameType))
        ) {
          /* istanbul ignore next */
          sb.emitHelper(
            node,
            options,
            sb.helpers.if({
              condition: () => {
                // [propVal, propVal, objectVal, objectVal]
                sb.emitOp(node, 'DUP');
                // [boolean, propVal, objectVal, objectVal]
                sb.emitHelper(node, options, sb.helpers.isSymbol);
              },
              whenTrue: handleSymbol,
              whenFalse: handleString,
            }),
          );
        } else if (tsUtils.type_.isOnlySymbolish(propertyNameType)) {
          handleSymbol();
        } else {
          handleString();
        }
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
        sb.emitHelper(element, options, sb.helpers.getPropertyObjectProperty);
      }

      if (initializer !== undefined) {
        sb.emitHelper(
          node,
          options,
          sb.helpers.if({
            condition: () => {
              // [val, val, objectVal]
              sb.emitOp(node, 'DUP');
              // [boolean, val, objectVal]
              sb.emitHelper(node, options, sb.helpers.isUndefined);
            },
            whenTrue: () => {
              // [objectVal]
              sb.emitOp(node, 'DROP');
              // [val, objectVal]
              sb.visit(initializer, options);
            },
          }),
        );
      }

      if (ts.isIdentifier(nameNode)) {
        // [objectVal]
        sb.scope.set(sb, element, options, tsUtils.node.getText(nameNode));
      } else {
        // [objectVal]
        sb.visit(nameNode, options);
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
      sb.emitHelper(node, options, sb.helpers.getSymbolObject);
      // [objectVal, sobj, iobj, propertyArr, symbolArr]
      sb.emitOp(node, 'SWAP');
      // [pobj, sobj, iobj, propertyArr, symbolArr]
      sb.emitHelper(node, options, sb.helpers.getPropertyObject);
      // [3, pobj, sobj, iobj, propertyArr, symbolArr]
      sb.emitPushInt(node, 3);
      // [obj, propertyArr, symbolArr]
      sb.emitHelper(node, options, sb.helpers.packObject);
      // [3, objectVal, propertyArr, symbolArr]
      sb.emitPushInt(node, 3);
      // [objectVal, propertyArr, symbolArr, objectVal]
      sb.emitOp(node, 'XTUCK');
      // [symbolArr, objectVal, propertyArr, objectVal]
      sb.emitOp(restElement, 'ROT');
      // [propertyArr, symbolArr, objectVal, objectVal]
      sb.emitOp(restElement, 'ROT');
      // [objectVal]
      sb.emitHelper(restElement, options, sb.helpers.omitObjectProperties);
      // []
      sb.scope.set(sb, restElement, options, name);
    }
  }
}
