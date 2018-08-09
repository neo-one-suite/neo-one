import ts from 'typescript';
import { Context } from '../../../Context';
import { handleTypeConversion } from './handleTypeConversion';

export function handleTypeAssignment(context: Context, fromNode: ts.Node, toNode: ts.Node): void {
  const fromType = context.getType(fromNode, { error: true });
  const toType = context.getType(toNode, { error: true });
  handleTypeConversion(context, fromNode, fromType, toNode, toType);
}
