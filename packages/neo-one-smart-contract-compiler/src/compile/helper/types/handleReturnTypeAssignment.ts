import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { Context } from '../../../Context';
import { handleTypeConversion } from './handleTypeConversion';

export function handleReturnTypeAssignment(context: Context, expr: ts.Node): void {
  const func = tsUtils.node.getFirstAncestorByTestOrThrow(expr, ts.isFunctionLike);
  const funcReturnType = context.analysis.getFunctionReturnType(func, { error: true });
  const exprType = context.getType(expr, { error: true });
  if (funcReturnType !== undefined && exprType !== undefined) {
    handleTypeConversion(context, expr, exprType, func, funcReturnType);
  }
}
