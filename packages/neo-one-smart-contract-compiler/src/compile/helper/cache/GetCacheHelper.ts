import ts from 'typescript';
import { GlobalProperty } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: []
// Output: [map]
export class GetCacheHelper extends Helper {
  public readonly needsGlobal = true;

  public emitGlobal(sb: ScriptBuilder, node: ts.Node, _options: VisitOptions): void {
    // [number, globalObject]
    sb.emitPushInt(node, GlobalProperty.Cache);
    // [map, number, globalObject]
    sb.emitOp(node, 'NEWMAP');
    // []
    sb.emitOp(node, 'SETITEM');
  }

  public emit(sb: ScriptBuilder, node: ts.Node, options: VisitOptions): void {
    if (!options.pushValue) {
      /* istanbul ignore next */
      return;
    }
    // [map]
    sb.emitHelper(node, options, sb.helpers.getGlobalProperty({ property: GlobalProperty.Cache }));
  }
}
