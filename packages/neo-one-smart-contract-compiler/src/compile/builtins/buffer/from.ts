import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { isOnlyString } from '../../helper/types';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { BuiltinMemberCall } from '../BuiltinMemberCall';
import { MemberLikeExpression } from '../types';

interface HashAndEncoding {
  readonly hash?: string;
  readonly encoding: string;
}

// tslint:disable-next-line export-name
export class BufferFrom extends BuiltinMemberCall {
  public emitCall(
    sb: ScriptBuilder,
    _func: MemberLikeExpression,
    node: ts.CallExpression,
    optionsIn: VisitOptions,
  ): void {
    const options = sb.pushValueOptions(optionsIn);
    if (tsUtils.argumented.getArguments(node).length < 1) {
      /* istanbul ignore next */
      return;
    }

    const result = this.getHashAndEncoding(node);
    if (result === undefined) {
      sb.context.reportUnsupported(node);

      return;
    }

    const { hash, encoding } = result;
    if (hash === undefined) {
      const arg = tsUtils.argumented.getArguments(node)[0];
      const argType = sb.context.analysis.getType(arg);
      if (argType !== undefined && !isOnlyString(sb.context, arg, argType)) {
        sb.context.reportUnsupported(node);
      }
      // [val]
      sb.visit(arg, options);
      // [string]
      sb.emitHelper(node, options, sb.helpers.unwrapString);
    } else {
      // [string]
      sb.emitPushBuffer(node, Buffer.from(hash, Buffer.isEncoding(encoding) ? encoding : undefined));
    }
    sb.emitHelper(node, optionsIn, sb.helpers.wrapBuffer);
  }

  private getHashAndEncoding(node: ts.CallExpression): HashAndEncoding | undefined {
    const args = tsUtils.argumented.getArguments(node);
    const hashArg = args[0];
    const encodingArg = args[1] as ts.Expression | undefined;
    if (encodingArg !== undefined && !ts.isStringLiteral(encodingArg)) {
      /* istanbul ignore next */
      return undefined;
    }
    const encoding = encodingArg === undefined ? 'utf8' : tsUtils.literal.getLiteralValue(encodingArg);
    if (ts.isStringLiteral(hashArg)) {
      const hash = tsUtils.literal.getLiteralValue(hashArg);

      return { hash, encoding };
    }

    if (encoding === 'utf8') {
      return { encoding };
    }

    return undefined;
  }
}
