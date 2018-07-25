import { ParameteredNode, tsUtils } from '@neo-one/ts-utils';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [argsArray]
// Output: []
export class ParametersHelper extends Helper<ParameteredNode> {
  public emit(sb: ScriptBuilder, node: ParameteredNode, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [argsarr]
    tsUtils.parametered.getParameters(node).forEach((param, idx) => {
      const nameValue = tsUtils.node.getName(param);
      if (nameValue === undefined) {
        sb.reportUnsupported(param);

        return;
      }

      const name = sb.scope.add(nameValue);

      const initializer = tsUtils.initializer.getInitializer(param);
      if (tsUtils.parameter.isRestParameter(param)) {
        // sb.reportUnsupported(param);
      } else if (initializer !== undefined) {
        sb.emitHelper(
          param,
          sb.noPushValueOptions(options),
          sb.helpers.if({
            condition: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [size, argsarr]
              sb.emitOp(param, 'ARRAYSIZE');
              // [idx, size, argsarr]
              sb.emitPushInt(param, idx);
              // [lt, argsarr]
              sb.emitOp(param, 'LTE');
            },
            whenTrue: () => {
              // [default, argsarr]
              sb.visit(initializer, sb.pushValueOptions(options));
            },
            whenFalse: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [idx, argsarr, argsarr]
              sb.emitPushInt(param, idx);
              // [arg, argsarr]
              sb.emitOp(param, 'PICKITEM');
              // [arg, arg, argsarr]
              sb.emitOp(param, 'DUP');
              sb.emitHelper(
                param,
                sb.noPushValueOptions(options),
                sb.helpers.if({
                  condition: () => {
                    // [isUndefined, arg, argsarr]
                    sb.emitHelper(param, sb.pushValueOptions(options), sb.helpers.isUndefined);
                  },
                  whenTrue: () => {
                    // [argsarr]
                    sb.emitOp(param, 'DROP');
                    // [default, argsarr]
                    sb.visit(initializer, sb.pushValueOptions(options));
                  },
                }),
              );
            },
          }),
        );
      } else if (tsUtils.parameter.isOptional(param)) {
        sb.emitHelper(
          param,
          sb.noPushValueOptions(options),
          sb.helpers.if({
            condition: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [size, argsarr]
              sb.emitOp(param, 'ARRAYSIZE');
              // [idx, size, argsarr]
              sb.emitPushInt(param, idx);
              // [lt, argsarr]
              sb.emitOp(param, 'LT');
            },
            whenTrue: () => {
              // [undefinedVal, argsarr]
              sb.emitHelper(param, sb.pushValueOptions(options), sb.helpers.createUndefined);
            },
            whenFalse: () => {
              // [argsarr, argsarr]
              sb.emitOp(param, 'DUP');
              // [idx, argsarr, argsarr]
              sb.emitPushInt(param, idx);
              // [arg, argsarr]
              sb.emitOp(param, 'PICKITEM');
            },
          }),
        );
      } else {
        // [argsarr, argsarr]
        sb.emitOp(param, 'DUP');
        // [idx, argsarr, argsarr]
        sb.emitPushInt(param, idx);
        // [arg, argsarr]
        sb.emitOp(param, 'PICKITEM');
      }

      const decorators = tsUtils.decoratable.getDecorators(param);
      if (decorators !== undefined && decorators.length > 0) {
        sb.reportUnsupported(param);
      }

      // [argsarr]
      sb.scope.set(sb, param, sb.plainOptions(options), name);
    });
    // []
    sb.emitOp(node, 'DROP');
  }
}
