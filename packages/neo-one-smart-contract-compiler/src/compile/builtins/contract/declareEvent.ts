import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinCall } from '../BuiltinCall';
import { Builtins } from '../Builtins';

class DeclareEvent extends BuiltinCall {
  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    if (!options.pushValue) {
      return;
    }

    sb.emitHelper(node, options, sb.helpers.wrapUndefined);
  }
}

// tslint:disable-next-line export-name
export const add = (builtins: Builtins): void => {
  builtins.addContractValue('declareEvent', new DeclareEvent());
};
