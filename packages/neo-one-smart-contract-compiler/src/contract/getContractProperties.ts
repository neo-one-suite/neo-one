import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ContractProperties, ContractPropertyName, DEFAULT_CONTRACT_PROPERTIES } from '../constants';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';

export const getContractProperties = (context: Context, smartContract: ts.ClassDeclaration): ContractProperties => {
  const type = context.analysis.getType(smartContract);
  const name = tsUtils.node.getName(smartContract);
  const defaultContractProperties = {
    ...DEFAULT_CONTRACT_PROPERTIES,
    name: name === undefined ? DEFAULT_CONTRACT_PROPERTIES.name : name,
  };

  if (type === undefined) {
    return defaultContractProperties;
  }

  const properties = tsUtils.type_
    .getProperties(type)
    .find((symbol) => tsUtils.symbol.getName(symbol) === ContractPropertyName.properties);

  if (properties === undefined) {
    return defaultContractProperties;
  }

  const decls = tsUtils.symbol
    .getDeclarations(properties)
    .filter(ts.isPropertyDeclaration)
    .filter((prop) => tsUtils.initializer.getInitializer(prop) !== undefined);
  if (decls.length === 0) {
    return defaultContractProperties;
  }

  if (decls.length !== 1) {
    context.reportError(
      smartContract,
      DiagnosticCode.InvalidContractProperties,
      DiagnosticMessage.InvalidContractPropertiesInitializer,
    );

    return defaultContractProperties;
  }

  const decl = decls[0];
  const initializer = tsUtils.initializer.getInitializerOrThrow(decl);

  if (!ts.isObjectLiteralExpression(initializer)) {
    context.reportError(
      smartContract,
      DiagnosticCode.InvalidContractProperties,
      DiagnosticMessage.InvalidContractPropertiesInitializer,
    );

    return defaultContractProperties;
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

      return defaultContractProperties;
    }

    const key = tsUtils.node.getName(property);
    const value = tsUtils.initializer.getInitializer(property);
    if (!ts.isLiteralExpression(value)) {
      context.reportError(
        value,
        DiagnosticCode.InvalidContractProperties,
        DiagnosticMessage.InvalidContractPropertiesInitializer,
      );

      return defaultContractProperties;
    }

    // tslint:disable-next-line no-object-mutation
    contract[key] = tsUtils.literal.getLiteralValue(value);
  }

  return {
    ...defaultContractProperties,
    ...contract,
  };
};
