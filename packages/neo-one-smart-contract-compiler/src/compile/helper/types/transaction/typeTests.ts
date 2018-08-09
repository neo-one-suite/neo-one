import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../../Context';

export const hasTransaction = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.hasType(type, (tpe) => isTransaction(context, node, tpe));

export const isOnlyTransaction = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  tsUtils.type_.isOnlyType(type, (tpe) => isTransaction(context, node, tpe));

export const isTransaction = (context: Context, node: ts.Node, type: ts.Type): boolean =>
  context.builtins.isInterface(node, type, 'TransactionBase') ||
  context.builtins.isInterface(node, type, 'MinerTransaction') ||
  context.builtins.isInterface(node, type, 'IssueTransaction') ||
  context.builtins.isInterface(node, type, 'ClaimTransaction') ||
  context.builtins.isInterface(node, type, 'EnrollmentTransaction') ||
  context.builtins.isInterface(node, type, 'RegisterTransaction') ||
  context.builtins.isInterface(node, type, 'ContractTransaction') ||
  context.builtins.isInterface(node, type, 'StateTransaction') ||
  context.builtins.isInterface(node, type, 'PublishTransaction') ||
  context.builtins.isInterface(node, type, 'InvocationTransaction') ||
  context.builtins.isType(node, type, 'Transaction');
