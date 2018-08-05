import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltInBase, BuiltInCall, BuiltInType, CallLikeExpression } from '../types';

// tslint:disable-next-line export-name
export class BufferFrom extends BuiltInBase implements BuiltInCall {
  public readonly types = new Set([BuiltInType.Call]);

  public canCall(_sb: ScriptBuilder, node: CallLikeExpression): boolean {
    return this.getHashAndEncoding(node) !== undefined;
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, options: VisitOptions): void {
    const result = this.getHashAndEncoding(node);
    if (result === undefined) {
      sb.reportUnsupported(node);

      return;
    }

    if (options.pushValue) {
      const { hash, encoding } = result;
      sb.emitPushBuffer(node, Buffer.from(hash, encoding));
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }

  private getHashAndEncoding(
    node: CallLikeExpression,
  ): { readonly hash: string; readonly encoding?: string } | undefined {
    if (!ts.isCallExpression(node)) {
      return undefined;
    }

    const args = tsUtils.argumented.getArguments(node);
    if (args.length !== 1 && args.length !== 2) {
      /* istanbul ignore next */
      return undefined;
    }

    const hashArg = args[0];
    const encodingArg = args[1] as ts.Expression | undefined;
    if (!ts.isStringLiteral(hashArg) || (encodingArg !== undefined && !ts.isStringLiteral(encodingArg))) {
      return undefined;
    }
    const hash = tsUtils.literal.getLiteralValue(hashArg);
    const encoding = encodingArg === undefined ? undefined : tsUtils.literal.getLiteralValue(encodingArg);

    return { hash, encoding };
  }
}
