import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

const invokeGlobal = (sb: ScriptBuilder, node: ts.Node, options: VisitOptions, property: GlobalProperty) => {
  // [1, val]
  sb.emitPushInt(node, 1);
  // [argsarr]
  sb.emitOp(node, 'PACK');
  // [val, argsarr]
  sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property }));
  // [val]
  sb.emitHelper(node, options, sb.helpers.invokeCall());
};

// tslint:disable-next-line export-name
export const invokeLogSerialize = (sb: ScriptBuilder, node: ts.Node, options: VisitOptions) =>
  invokeGlobal(sb, node, options, GlobalProperty.GenericLogSerialize);
