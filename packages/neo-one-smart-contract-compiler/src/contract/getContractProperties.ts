import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ContractProperties, DEFAULT_CONTRACT_PROPERTIES, PROPERTIES_PROPERTY } from '../constants';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';

export const getContractProperties = (context: Context, smartContract: ts.ClassDeclaration): ContractProperties => {
  const type = context.analysis.getType(smartContract);
  if (type === undefined) {
    return DEFAULT_CONTRACT_PROPERTIES;
  }

  const properties = tsUtils.type_
    .getProperties(type)
    .find((symbol) => tsUtils.symbol.getName(symbol) === PROPERTIES_PROPERTY);

  if (properties === undefined) {
    return DEFAULT_CONTRACT_PROPERTIES;
  }

  const decls = tsUtils.symbol
    .getDeclarations(properties)
    .filter(ts.isPropertyDeclaration)
    .filter((prop) => tsUtils.initializer.getInitializer(prop) !== undefined);
  if (decls.length !== 1) {
    context.reportError(
      smartContract,
      DiagnosticCode.InvalidContractProperties,
      DiagnosticMessage.InvalidContractPropertiesInitializer,
    );

    return DEFAULT_CONTRACT_PROPERTIES;
  }

  const decl = decls[0];
  const initializer = tsUtils.initializer.getInitializerOrThrow(decl);

  if (!ts.isObjectLiteralExpression(initializer)) {
    context.reportError(
      smartContract,
      DiagnosticCode.InvalidContractProperties,
      DiagnosticMessage.InvalidContractPropertiesInitializer,
    );

    return DEFAULT_CONTRACT_PROPERTIES;
  }

  const contract: { [key: string]: string } = {};
  // tslint:disable-next-line no-loop-statement
  for (const property of tsUtils.object_.getProperties(initializer)) {
    if (!ts.isPropertyAssignment(property)) {
      context.reportError(
        property,
        DiagnosticCode.InvalidContractProperties,
        DiagnosticMessage.InvalidContractPropertiesInitializer,
      );

      return DEFAULT_CONTRACT_PROPERTIES;
    }

    const key = tsUtils.node.getName(property);
    const value = tsUtils.initializer.getInitializer(property);
    if (!ts.isLiteralExpression(value) && !tsUtils.guards.isBooleanLiteral(value)) {
      context.reportError(
        value,
        DiagnosticCode.InvalidContractProperties,
        DiagnosticMessage.InvalidContractPropertiesInitializer,
      );

      return DEFAULT_CONTRACT_PROPERTIES;
    }

    if (ts.isLiteralExpression(value)) {
      // tslint:disable-next-line no-object-mutation
      contract[key] = tsUtils.literal.getLiteralValue(value);
    }
  }

  return {
    ...DEFAULT_CONTRACT_PROPERTIES,
    ...contract,
  };
};
