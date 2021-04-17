import { common, ContractGroup, ContractPermission, WildcardContainer } from '@neo-one/client-common';
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
    name: name ?? DEFAULT_CONTRACT_PROPERTIES.name,
  };

  if (type === undefined) {
    return defaultContractProperties;
  }

  const properties = tsUtils.type_
    .getProperties(type)
    .find((symbol) => tsUtils.symbol.getName(symbol) === ContractPropertyName.properties);

  if (properties === undefined) {
    context.reportWarning(
      smartContract,
      DiagnosticCode.InvalidContractProperties,
      DiagnosticMessage.InvalidContractPropertiesWarning,
    );

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

  const contract: {
    trusts?: WildcardContainer<string>;
    permissions?: readonly ContractPermission[];
    groups?: readonly ContractGroup[];
  } = {};
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

    if (key === 'groups') {
      const groupsArray = tsUtils.initializer.getInitializerOrThrow(value.parent);
      if (!ts.isArrayLiteralExpression(groupsArray)) {
        context.reportError(
          groupsArray,
          DiagnosticCode.InvalidContractProperties,
          DiagnosticMessage.InvalidContractPropertyGroups,
        );

        continue;
      }

      const elements = tsUtils.expression.getElements(groupsArray);
      const finalGroupsArray: ContractGroup[] = [];

      elements.forEach((elem) => {
        if (!ts.isObjectLiteralExpression(elem)) {
          context.reportError(
            elem,
            DiagnosticCode.InvalidContractProperties,
            DiagnosticMessage.InvalidContractPropertyGroups,
          );

          return;
        }

        const newObjToPush: { [key: string]: string } = {};
        // tslint:disable-next-line: no-loop-statement
        for (const innerProperty of tsUtils.object_.getProperties(elem)) {
          if (!ts.isPropertyAssignment(innerProperty)) {
            context.reportError(
              innerProperty,
              DiagnosticCode.InvalidContractProperties,
              DiagnosticMessage.InvalidContractPropertyGroups,
            );

            continue;
          }

          const innerKey = tsUtils.node.getName(innerProperty);
          const innerValue = tsUtils.initializer.getInitializer(innerProperty);
          if (!ts.isLiteralExpression(innerValue)) {
            context.reportError(
              innerValue,
              DiagnosticCode.InvalidContractProperties,
              DiagnosticMessage.InvalidContractPropertyGroups,
            );

            continue;
          }

          const stringValue = tsUtils.literal.getLiteralValue(innerValue);

          if (innerKey === 'publicKey') {
            try {
              common.stringToECPoint(stringValue);
            } catch {
              context.reportError(
                innerValue,
                DiagnosticCode.InvalidContractProperties,
                DiagnosticMessage.InvalidContractPropertyGroups,
              );

              continue;
            }
          }

          // tslint:disable-next-line: no-object-mutation
          newObjToPush[innerKey] = stringValue;
        }

        // tslint:disable-next-line: no-array-mutation
        finalGroupsArray.push((newObjToPush as unknown) as ContractGroup);
      });

      // tslint:disable-next-line: no-object-mutation
      contract.groups = finalGroupsArray;
    }

    if (key === 'permissions') {
      const permissionsArray = tsUtils.initializer.getInitializerOrThrow(value.parent);
      if (!ts.isArrayLiteralExpression(permissionsArray)) {
        context.reportError(
          permissionsArray,
          DiagnosticCode.InvalidContractProperties,
          DiagnosticMessage.InvalidContractPropertyPermissions,
        );

        continue;
      }

      const elements = tsUtils.expression.getElements(permissionsArray);
      const finalPermissionsArray: ContractPermission[] = [];

      elements.forEach((elem) => {
        if (!ts.isObjectLiteralExpression(elem)) {
          context.reportError(
            elem,
            DiagnosticCode.InvalidContractProperties,
            DiagnosticMessage.InvalidContractPropertyPermissions,
          );

          return;
        }

        const permissionObject: {
          contract?: { hash?: string; group?: string };
          methods?: WildcardContainer<string>;
        } = {
          contract: undefined,
          methods: undefined,
        };
        // tslint:disable-next-line: no-loop-statement
        for (const innerProperty of tsUtils.object_.getProperties(elem)) {
          if (!ts.isPropertyAssignment(innerProperty)) {
            context.reportError(
              innerProperty,
              DiagnosticCode.InvalidContractProperties,
              DiagnosticMessage.InvalidContractPropertyPermissions,
            );

            continue;
          }

          const innerKey = tsUtils.node.getName(innerProperty);
          const innerValue = tsUtils.initializer.getInitializer(innerProperty);

          if (
            !ts.isLiteralExpression(innerValue) &&
            !ts.isObjectLiteralExpression(innerValue) &&
            !ts.isArrayLiteralExpression(innerValue)
          ) {
            context.reportError(
              innerValue,
              DiagnosticCode.InvalidContractProperties,
              DiagnosticMessage.InvalidContractPropertyPermissions,
            );

            continue;
          }

          const innerMethodsArray: string[] = [];

          if (innerKey === 'methods') {
            if (!ts.isLiteralExpression(innerValue) && !ts.isArrayLiteralExpression(innerValue)) {
              context.reportError(
                innerValue,
                DiagnosticCode.InvalidContractProperties,
                DiagnosticMessage.InvalidContractPropertyPermissions,
              );

              return;
            }

            if (ts.isLiteralExpression(innerValue)) {
              const stringValue = tsUtils.literal.getLiteralValue(innerValue);
              if (stringValue !== '*') {
                context.reportError(
                  innerValue,
                  DiagnosticCode.InvalidContractProperties,
                  DiagnosticMessage.InvalidContractPropertyPermissions,
                );

                return;
              }

              // tslint:disable-next-line: no-object-mutation
              permissionObject.methods = stringValue;

              continue;
            }

            if (ts.isArrayLiteralExpression(innerValue)) {
              const arrayElements = tsUtils.expression.getElements(innerValue);

              arrayElements.forEach((methodElem) => {
                if (!ts.isLiteralExpression(methodElem)) {
                  context.reportError(
                    methodElem,
                    DiagnosticCode.InvalidContractProperties,
                    DiagnosticMessage.InvalidContractPropertyPermissions,
                  );

                  return;
                }

                const literalString = tsUtils.literal.getLiteralValue(methodElem);

                // tslint:disable-next-line: no-array-mutation
                innerMethodsArray.push(literalString);
              });

              // tslint:disable-next-line: no-object-mutation
              permissionObject.methods = innerMethodsArray;
            }
          }

          const innerContractObject: { hash?: string; group?: string } = { hash: undefined, group: undefined };

          if (innerKey === 'contract') {
            if (!ts.isObjectLiteralExpression(innerValue)) {
              context.reportError(
                innerValue,
                DiagnosticCode.InvalidContractProperties,
                DiagnosticMessage.InvalidContractPropertyPermissions,
              );

              return;
            }

            // tslint:disable-next-line: no-loop-statement
            for (const innerInnerProp of tsUtils.object_.getProperties(innerValue)) {
              if (!ts.isPropertyAssignment(innerInnerProp)) {
                context.reportError(
                  innerInnerProp,
                  DiagnosticCode.InvalidContractProperties,
                  DiagnosticMessage.InvalidContractPropertyPermissions,
                );

                continue;
              }

              const contractKey = tsUtils.node.getName(innerInnerProp);
              const contractValue = tsUtils.initializer.getInitializer(innerInnerProp);
              if (!ts.isLiteralExpression(contractValue)) {
                context.reportError(
                  contractValue,
                  DiagnosticCode.InvalidContractProperties,
                  DiagnosticMessage.InvalidContractPropertyPermissions,
                );

                return;
              }

              const contractValueString = tsUtils.literal.getLiteralValue(contractValue);

              if (contractKey === 'hash') {
                try {
                  common.stringToUInt160(contractValueString);
                } catch {
                  context.reportError(
                    contractValue,
                    DiagnosticCode.InvalidContractProperties,
                    DiagnosticMessage.InvalidContractPropertyPermissions,
                  );

                  return;
                }

                // tslint:disable-next-line: no-object-mutation
                innerContractObject.hash = contractValueString;
              }

              if (contractKey === 'group') {
                try {
                  common.stringToECPoint(contractValueString);
                } catch {
                  context.reportError(
                    contractValue,
                    DiagnosticCode.InvalidContractProperties,
                    DiagnosticMessage.InvalidContractPropertyPermissions,
                  );

                  return;
                }

                // tslint:disable-next-line: no-object-mutation
                innerContractObject.group = contractValueString;
              }
            }

            // tslint:disable-next-line: no-object-mutation
            permissionObject.contract = innerContractObject;
          }
        }

        // tslint:disable-next-line: no-array-mutation
        finalPermissionsArray.push((permissionObject as unknown) as ContractPermission);
      });

      // tslint:disable-next-line: no-object-mutation
      contract.permissions = finalPermissionsArray;
    }

    if (key === 'trusts') {
      const trustsArray = tsUtils.initializer.getInitializerOrThrow(value.parent);
      if (ts.isLiteralExpression(trustsArray)) {
        const trustsString = tsUtils.literal.getLiteralValue(trustsArray);
        if (trustsString !== '*') {
          context.reportError(
            trustsArray,
            DiagnosticCode.InvalidContractProperties,
            DiagnosticMessage.InvalidContractPropertyTrusts,
          );

          continue;
        }

        // tslint:disable-next-line: no-object-mutation
        contract.trusts = trustsString;

        continue;
      }

      if (!ts.isArrayLiteralExpression(trustsArray)) {
        context.reportError(
          trustsArray,
          DiagnosticCode.InvalidContractProperties,
          DiagnosticMessage.InvalidContractPropertyTrusts,
        );

        continue;
      }

      const elements = tsUtils.expression.getElements(trustsArray);
      const finalTrustsArray: string[] = [];

      elements.forEach((elem) => {
        if (!ts.isLiteralExpression(elem)) {
          context.reportError(
            elem,
            DiagnosticCode.InvalidContractProperties,
            DiagnosticMessage.InvalidContractPropertyTrusts,
          );

          return;
        }

        const literalString = tsUtils.literal.getLiteralValue(elem);

        try {
          common.stringToUInt160(literalString);
          // tslint:disable-next-line: no-array-mutation
          finalTrustsArray.push(literalString);
        } catch {
          context.reportError(
            elem,
            DiagnosticCode.InvalidContractProperties,
            DiagnosticMessage.InvalidContractPropertyTrusts,
          );

          return;
        }
      });

      // tslint:disable-next-line: no-object-mutation
      contract.trusts = finalTrustsArray;
    }
  }

  return {
    ...defaultContractProperties,
    ...contract,
  };
};
