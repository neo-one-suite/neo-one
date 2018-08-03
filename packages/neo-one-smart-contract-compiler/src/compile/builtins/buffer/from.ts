import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType } from '../types';

// tslint:disable-next-line export-name
export class BufferFrom extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public emitCall(sb: ScriptBuilder, node: ts.CallExpression, options: VisitOptions): void {
    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 1 && args.length !== 2) {
      /* istanbul ignore next */
      sb.reportUnsupported(node);

      /* istanbul ignore next */
      return;
    }

    const hash = args[0];
    const encodingArg = args[1] as ts.Expression | undefined;
    if (!ts.isStringLiteral(hash) || (encodingArg !== undefined && !ts.isStringLiteral(encodingArg))) {
      sb.reportUnsupported(node);

      return;
    }

    if (options.pushValue) {
      const encoding = encodingArg === undefined ? undefined : tsUtils.literal.getLiteralValue(encodingArg);
      sb.emitPushBuffer(node, Buffer.from(tsUtils.literal.getLiteralValue(hash), encoding));
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }
}
