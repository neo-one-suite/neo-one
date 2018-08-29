import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { InternalObjectProperty } from '../constants';
import { NodeCompiler } from '../NodeCompiler';
import { ScriptBuilder } from '../sb';
import { VisitOptions } from '../types';

export class ObjectLiteralExpressionCompiler extends NodeCompiler<ts.ObjectLiteralExpression> {
  public readonly kind = ts.SyntaxKind.ObjectLiteralExpression;

  public visitNode(sb: ScriptBuilder, node: ts.ObjectLiteralExpression, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [objectVal]
    sb.emitHelper(node, options, sb.helpers.createObject);
    tsUtils.object_.getProperties(node).forEach((prop) => {
      if (ts.isGetAccessorDeclaration(prop) && tsUtils.accessor.getSetAccessor(prop) !== undefined) {
        return;
      }

      // [objectVal, objectVal]
      sb.emitOp(prop, 'DUP');
      if (
        ts.isPropertyAssignment(prop) ||
        ts.isMethodDeclaration(prop) ||
        ts.isGetAccessorDeclaration(prop) ||
        ts.isSetAccessorDeclaration(prop)
      ) {
        const propertyName = tsUtils.node.getNameNode(prop);

        const visitProp = () => {
          if (ts.isPropertyAssignment(prop)) {
            sb.visit(tsUtils.initializer.getInitializer(prop), options);
          } else {
            // [callArr]
            sb.emitHelper(prop, options, sb.helpers.createCallArray);
            // [callObj]
            sb.emitHelper(
              prop,
              options,
              sb.helpers.createFunctionObject({
                property: InternalObjectProperty.Call,
              }),
            );
          }

          if (ts.isSetAccessorDeclaration(prop)) {
            const getAccessor = tsUtils.accessor.getGetAccessor(prop);
            if (getAccessor !== undefined) {
              sb.emitHelper(getAccessor, options, sb.helpers.createCallArray);
              sb.emitHelper(
                getAccessor,
                options,
                sb.helpers.createFunctionObject({
                  property: InternalObjectProperty.Call,
                }),
              );
            }
          }
        };

        const setSymbolProperty = () => {
          if (ts.isSetAccessorDeclaration(prop) || ts.isGetAccessorDeclaration(prop)) {
            sb.emitHelper(
              prop,
              options,
              sb.helpers.setAccessorSymbolObjectProperty({
                hasSet: ts.isSetAccessorDeclaration(prop),
                hasGet: ts.isGetAccessorDeclaration(prop) || tsUtils.accessor.getGetAccessor(prop) !== undefined,
              }),
            );
          } else {
            // [objectVal]
            sb.emitHelper(prop, options, sb.helpers.setSymbolObjectProperty);
          }
        };

        const setDataProperty = () => {
          if (ts.isSetAccessorDeclaration(prop) || ts.isGetAccessorDeclaration(prop)) {
            sb.emitHelper(
              prop,
              options,
              sb.helpers.setAccessorPropertyObjectProperty({
                hasSet: ts.isSetAccessorDeclaration(prop),
                hasGet: ts.isGetAccessorDeclaration(prop) || tsUtils.accessor.getGetAccessor(prop) !== undefined,
              }),
            );
          } else {
            // [objectVal]
            sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
          }
        };

        const handlePossibleSymbol = (propertyNameType: ts.Type | undefined) => {
          const handleSymbol = () => {
            // [string, objectVal, objectVal]
            sb.emitHelper(prop, options, sb.helpers.unwrapSymbol);
            // [val, string, objectVal, objectVal]
            visitProp();
            // [objectVal]
            setSymbolProperty();
          };

          const handleString = () => {
            // [string, objectVal, objectVal]
            sb.emitHelper(prop, options, sb.helpers.toString({ type: propertyNameType }));
            // [val, string, objectVal, objectVal]
            visitProp();
            // [objectVal]
            setDataProperty();
          };

          if (
            propertyNameType === undefined ||
            (!tsUtils.type_.isOnlySymbolish(propertyNameType) && tsUtils.type_.hasSymbolish(propertyNameType))
          ) {
            /* istanbul ignore next */
            sb.emitHelper(
              prop,
              options,
              sb.helpers.if({
                condition: () => {
                  // [propVal, propVal, objectVal, objectVal]
                  sb.emitOp(prop, 'DUP');
                  // [boolean, propVal, objectVal, objectVal]
                  sb.emitHelper(prop, options, sb.helpers.isSymbol);
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
        };

        if (ts.isComputedPropertyName(propertyName)) {
          const expr = tsUtils.expression.getExpression(propertyName);
          const propertyNameType = sb.context.analysis.getType(expr);

          // [propVal, objectVal, objectVal]
          sb.visit(expr, options);
          // [objectVal]
          handlePossibleSymbol(propertyNameType);
        } else {
          if (ts.isIdentifier(propertyName)) {
            // [string, objectVal, objectVal]
            sb.emitPushString(propertyName, tsUtils.node.getText(propertyName));
          } else {
            // [string, objectVal, objectVal]
            sb.emitPushString(
              propertyName,
              ts.isStringLiteral(propertyName)
                ? tsUtils.literal.getLiteralValue(propertyName)
                : `${tsUtils.literal.getLiteralValue(propertyName)}`,
            );
          }
          // [val, string, objectVal, objectVal]
          visitProp();
          // [objectVal]
          setDataProperty();
        }
      } else if (ts.isShorthandPropertyAssignment(prop)) {
        const propertyName = tsUtils.node.getNameNode(prop);
        // [string, objectVal, objectVal]
        sb.emitPushString(propertyName, tsUtils.node.getText(propertyName));
        // [val, string, objectVal, objectVal]
        sb.visit(propertyName, options);
        // [objectVal]
        sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
      } else {
        const val = sb.scope.addUnique();
        const objectVal = sb.scope.addUnique();
        // [objectVal]
        sb.scope.set(sb, node, options, objectVal);
        // [objectVal, objectVal]
        sb.visit(tsUtils.expression.getExpression(prop), options);
        // [val, val, objectVal]
        sb.emitOp(node, 'DUP');
        // [val, objectVal]
        sb.scope.set(sb, node, options, val);
        // [arr, objectVal]
        sb.emitHelper(node, options, sb.helpers.getPropertyObjectKeys);
        // [objectVal]
        sb.emitHelper(
          node,
          options,
          sb.helpers.arrForEach({
            each: () => {
              // [objectVal, prop]
              sb.scope.get(sb, node, options, objectVal);
              // [prop, objectVal]
              sb.emitOp(node, 'SWAP');
              // [val, prop, objectVal]
              sb.scope.get(sb, node, options, val);
              // [prop, val, prop, objectVal]
              sb.emitOp(node, 'OVER');
              // [val, prop, objectVal]
              sb.emitHelper(node, options, sb.helpers.getPropertyObjectProperty);
              // []
              sb.emitHelper(node, options, sb.helpers.setDataPropertyObjectProperty);
            },
          }),
        );
      }
    });

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
