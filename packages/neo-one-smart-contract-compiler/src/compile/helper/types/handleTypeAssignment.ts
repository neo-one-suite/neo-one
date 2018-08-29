import ts from 'typescript';
import { Context } from '../../../Context';
import { handleTypeConversion } from './handleTypeConversion';

export function handleTypeAssignment(context: Context, fromNode: ts.Node, toNode: ts.Node): void {
  const fromType = context.analysis.getType(fromNode);
  const toType = context.analysis.getType(toNode);
  handleTypeConversion(context, fromNode, fromType, toNode, toType);
}
