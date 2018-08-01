import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { InternalFunctionProperties } from '../helper';
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
      const handlePossibleSymbol = (propertyNameType: ts.Type | undefined) => {
        const handleSymbol = () => {
          // [string, val, objectVal, objectVal]
          sb.emitHelper(prop, options, sb.helpers.getSymbol);
          // [val, string, objectVal, objectVal]
          sb.emitOp(prop, 'SWAP');
          // [objectVal]
          sb.emitHelper(prop, options, sb.helpers.setSymbolObjectProperty);
        };

        const handleString = () => {
          // [string, val, objectVal, objectVal]
          sb.emitHelper(prop, options, sb.helpers.toString({ type: propertyNameType }));
          // [val, string, objectVal, objectVal]
          sb.emitOp(prop, 'SWAP');
          // [objectVal]
          sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
        };

        if (
          propertyNameType === undefined ||
          (!tsUtils.type_.isOnlySymbolish(propertyNameType) && tsUtils.type_.hasSymbolish(propertyNameType))
        ) {
          sb.emitHelper(
            prop,
            options,
            sb.helpers.if({
              condition: () => {
                // [propVal, propVal, val, objectVal, objectVal]
                sb.emitOp(prop, 'DUP');
                // [boolean, propVal, val, objectVal, objectVal]
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

      // [objectVal, objectVal]
      sb.emitOp(prop, 'DUP');
      if (ts.isPropertyAssignment(prop) || ts.isMethodDeclaration(prop)) {
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
                property: InternalFunctionProperties.Call,
              }),
            );
          }
        };

        if (ts.isComputedPropertyName(propertyName)) {
          const expr = tsUtils.expression.getExpression(propertyName);
          const propertyNameType = sb.getType(expr);

          // [val, objectVal, objectVal]
          visitProp();
          // [propVal, val, objectVal, objectVal]
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
          sb.emitHelper(prop, options, sb.helpers.setDataPropertyObjectProperty);
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
        sb.reportUnsupported(prop);
      }
    });

    if (!optionsIn.pushValue) {
      sb.emitOp(node, 'DROP');
    }
  }
}
