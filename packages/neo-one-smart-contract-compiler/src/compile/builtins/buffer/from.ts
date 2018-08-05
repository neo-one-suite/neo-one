import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinBase, BuiltinCall, BuiltinType, CallLikeExpression } from '../types';

interface HashAndEncoding {
  readonly hash: string;
  readonly encoding?: string;
}

// tslint:disable-next-line export-name
export class BufferFrom extends BuiltinBase implements BuiltinCall {
  public readonly types = new Set([BuiltinType.Call]);

  public canCall(): boolean {
    throw new Error('Something went wrong.');
  }

  public emitCall(sb: ScriptBuilder, node: CallLikeExpression, options: VisitOptions): void {
    const result = this.getHashAndEncoding(node);
    if (result === undefined) {
      /* istanbul ignore next */
      sb.reportUnsupported(node);

      /* istanbul ignore next */
      return;
    }

    if (options.pushValue) {
      const { hash, encoding } = result;
      sb.emitPushBuffer(node, Buffer.from(hash, encoding));
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }

  private getHashAndEncoding(node: CallLikeExpression): HashAndEncoding | undefined {
    if (!ts.isCallExpression(node)) {
      /* istanbul ignore next */
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
      /* istanbul ignore next */
      return undefined;
    }
    const hash = tsUtils.literal.getLiteralValue(hashArg);
    const encoding = encodingArg === undefined ? undefined : tsUtils.literal.getLiteralValue(encodingArg);

    return { hash, encoding };
  }
}
