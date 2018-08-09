import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

interface HashAndEncoding {
  readonly hash: string;
  readonly encoding?: string;
}

// tslint:disable-next-line export-name
export class BufferFrom extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    options: VisitOptions,
  ): void {
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const result = this.getHashAndEncoding(node);
    if (result === undefined) {
      sb.context.reportUnsupported(node);

      return;
    }

    if (options.pushValue) {
      const { hash, encoding } = result;
      sb.emitPushBuffer(node, Buffer.from(hash, encoding));
      sb.emitHelper(node, options, sb.helpers.wrapBuffer);
    }
  }

  private getHashAndEncoding(node: ts.CallExpression): HashAndEncoding | undefined {
    const args = tsUtils.argumented.getArguments(node);
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
